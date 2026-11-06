// Ocean: rolling waves, refraction of the seabed, colour that deepens with depth, shore foam.
shader_type spatial;
render_mode cull_disabled, depth_draw_always, specular_schlick_ggx;

uniform sampler2D screen_tex : hint_screen_texture, filter_linear_mipmap;
uniform sampler2D depth_tex : hint_depth_texture, filter_linear_mipmap;
uniform vec3 deep_color : source_color = vec3(0.02, 0.16, 0.26);
uniform vec3 shallow_color : source_color = vec3(0.09, 0.52, 0.5);
uniform vec3 foam_color : source_color = vec3(0.93, 0.96, 1.0);
uniform float wave_scale = 1.0;
uniform float clarity = 0.42;
uniform float day = 1.0;

varying vec3 wpos;

void add_wave(vec2 p, vec2 dir, float k, float a, float s, float t, inout float h, inout vec2 d) {
	float ph = dot(dir, p) * k - t * s;
	h += a * sin(ph);
	d += dir * k * a * cos(ph);
}

void waves(vec2 p, float t, inout float h, inout vec2 d) {
	add_wave(p, normalize(vec2(1.0, 0.35)), 0.075, 0.32, 1.1, t, h, d);
	add_wave(p, normalize(vec2(-0.45, 1.0)), 0.12, 0.18, 1.5, t, h, d);
	add_wave(p, normalize(vec2(0.7, -0.6)), 0.21, 0.09, 2.0, t, h, d);
	add_wave(p, normalize(vec2(-0.9, -0.2)), 0.37, 0.045, 2.7, t, h, d);
}

void vertex() {
	vec3 w = (MODEL_MATRIX * vec4(VERTEX, 1.0)).xyz;
	float h = 0.0;
	vec2 d = vec2(0.0);
	waves(w.xz, TIME, h, d);
	h *= wave_scale;
	d *= wave_scale;
	VERTEX.y += h;
	NORMAL = normalize(vec3(-d.x, 1.0, -d.y));
	wpos = w + vec3(0.0, h, 0.0);
}

void fragment() {
	vec2 p = wpos.xz;
	float t = TIME;
	vec3 rip = normalize(vec3(
		sin(p.x * 1.3 + t * 1.7) * 0.05 + sin(p.y * 2.1 - t * 1.2) * 0.04 + sin((p.x + p.y) * 4.3 + t * 2.6) * 0.02,
		1.0,
		cos(p.y * 1.1 + t * 1.5) * 0.05 + cos(p.x * 1.9 + t) * 0.04 + cos((p.x - p.y) * 3.7 - t * 2.2) * 0.02));
	vec3 n = normalize(NORMAL + (VIEW_MATRIX * vec4(rip, 0.0)).xyz - (VIEW_MATRIX * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
	NORMAL = n;

	float depth = texture(depth_tex, SCREEN_UV).r;
	vec4 sp = INV_PROJECTION_MATRIX * vec4(SCREEN_UV * 2.0 - 1.0, depth, 1.0);
	sp.xyz /= sp.w;
	float thick = max(VERTEX.z - sp.z, 0.0);

	vec2 ruv = SCREEN_UV + n.xz * 0.035 * clamp(thick * 0.5, 0.0, 1.0);
	float d2 = texture(depth_tex, ruv).r;
	vec4 sp2 = INV_PROJECTION_MATRIX * vec4(ruv * 2.0 - 1.0, d2, 1.0);
	sp2.xyz /= sp2.w;
	if (sp2.z > VERTEX.z) {
		ruv = SCREEN_UV;
	}
	vec3 refr = textureLod(screen_tex, ruv, 0.0).rgb;

	float absorb = 1.0 - exp(-thick * clarity);
	vec3 body = mix(shallow_color, deep_color, clamp(thick / 9.0, 0.0, 1.0));
	float swash = sin(t * 0.9 + p.x * 0.11 + p.y * 0.07) * 0.18;
	float foam = smoothstep(0.55, 0.05, thick + swash) * (0.6 + 0.4 * sin(p.x * 3.1 + t) * sin(p.y * 2.7 - t * 1.3));
	foam = clamp(foam, 0.0, 1.0);

	ALBEDO = body * absorb * (1.0 - foam) + foam_color * foam;
	EMISSION = refr * mix(vec3(1.0), shallow_color * 1.7, 0.35) * (1.0 - absorb) * (1.0 - foam);
	ROUGHNESS = mix(0.03, 0.6, foam);
	METALLIC = 0.0;
	SPECULAR = 0.6;
	ALPHA = 1.0;
}
