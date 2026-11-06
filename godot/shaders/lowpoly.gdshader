// Faceted low-poly look of the isles: vertex colours as albedo, flat per-face normals.
shader_type spatial;
render_mode cull_disabled;

uniform float roughness_amount = 0.85;

void fragment() {
	ALBEDO = COLOR.rgb;
	vec3 n = normalize(cross(dFdx(VERTEX), dFdy(VERTEX)));
	if (dot(n, VERTEX) > 0.0) {
		n = -n;
	}
	NORMAL = n;
	ROUGHNESS = roughness_amount;
	METALLIC = 0.0;
	SPECULAR = 0.35;
}
