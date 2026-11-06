extends Node3D
## Driftwood Isles in Godot: loads the islands exported from the web game, builds the sky, sun,
## day/night cycle and ocean, and spawns the player angler.

const DAY_LENGTH := 720.0  # seconds for a full day
const LOWPOLY := preload("res://shaders/lowpoly.gdshader")
const WATER := preload("res://shaders/water.gdshader")

var day_time := 0.32  # 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
var env: Environment
var sky_mat: ProceduralSkyMaterial
var sun: DirectionalLight3D
var water: MeshInstance3D
var water_mat: ShaderMaterial
var player: CharacterBody3D
var island_mat: ShaderMaterial

func _ready() -> void:
	island_mat = ShaderMaterial.new()
	island_mat.shader = LOWPOLY
	_build_environment()
	_build_water()
	var info: Dictionary = _load_json("res://assets/world.json")
	var islands: Dictionary = info.get("islands", {})
	for key in islands:
		var path := "res://assets/islands/%s.glb" % key
		if not ResourceLoader.exists(path):
			push_warning("Missing island file: " + path)
			continue
		var scene: PackedScene = load(path)
		var inst := scene.instantiate()
		inst.name = "Island_" + key
		add_child(inst)
		_prepare_meshes(inst, true)
	player = load("res://scripts/player.gd").new()
	player.name = "Player"
	add_child(player)
	var start: String = info.get("start", "cove")
	var sp = islands.get(start, {}).get("spawn", null)
	if sp:
		player.global_position = Vector3(sp["x"], float(sp["y"]) + 1.5, sp["z"])
		player.cam_yaw = float(sp["yaw"]) + PI
	_update_sky(0.0)

func _prepare_meshes(node: Node, collide: bool) -> void:
	for child in node.get_children():
		_prepare_meshes(child, collide)
	if node is MeshInstance3D:
		var mi := node as MeshInstance3D
		mi.material_override = island_mat
		if collide:
			mi.create_trimesh_collision()

func _build_environment() -> void:
	var we := WorldEnvironment.new()
	env = Environment.new()
	sky_mat = ProceduralSkyMaterial.new()
	sky_mat.sky_curve = 0.12
	sky_mat.ground_curve = 0.04
	sky_mat.sun_angle_max = 25.0
	sky_mat.sun_curve = 0.08
	var sky := Sky.new()
	sky.sky_material = sky_mat
	env.background_mode = Environment.BG_SKY
	env.sky = sky
	env.ambient_light_source = Environment.AMBIENT_SOURCE_SKY
	env.reflected_light_source = Environment.REFLECTION_SOURCE_SKY
	env.ambient_light_sky_contribution = 0.85
	env.tonemap_mode = Environment.TONE_MAPPER_ACES
	env.tonemap_exposure = 1.0
	env.glow_enabled = true
	env.glow_intensity = 0.6
	env.glow_bloom = 0.08
	env.ssao_enabled = true
	env.ssao_radius = 1.2
	env.ssao_intensity = 1.6
	env.fog_enabled = true
	env.fog_density = 0.0012
	env.fog_sky_affect = 0.25
	env.fog_aerial_perspective = 0.6
	env.adjustment_enabled = true
	env.adjustment_saturation = 1.18
	env.adjustment_contrast = 1.05
	we.environment = env
	add_child(we)
	sun = DirectionalLight3D.new()
	sun.shadow_enabled = true
	sun.directional_shadow_max_distance = 220.0
	sun.directional_shadow_blend_splits = true
	sun.light_angular_distance = 0.6
	sun.shadow_bias = 0.08
	sun.shadow_normal_bias = 2.5
	add_child(sun)

func _build_water() -> void:
	water = MeshInstance3D.new()
	var pm := PlaneMesh.new()
	pm.size = Vector2(1600, 1600)
	pm.subdivide_width = 320
	pm.subdivide_depth = 320
	water.mesh = pm
	water_mat = ShaderMaterial.new()
	water_mat.shader = WATER
	water.material_override = water_mat
	water.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(water)

func _process(delta: float) -> void:
	_update_sky(delta)
	if player:
		# the ocean follows the player in 5 m steps so the waves never slide
		var p := player.global_position
		water.global_position = Vector3(snappedf(p.x, 5.0), 0.0, snappedf(p.z, 5.0))
	if Input.is_key_pressed(KEY_BRACKETRIGHT):
		day_time = fmod(day_time + delta * 0.05, 1.0)
	if Input.is_key_pressed(KEY_BRACKETLEFT):
		day_time = fmod(day_time - delta * 0.05 + 1.0, 1.0)

func _update_sky(delta: float) -> void:
	day_time = fmod(day_time + delta / DAY_LENGTH, 1.0)
	var a := (day_time - 0.25) * TAU
	var sun_dir := Vector3(cos(a) * 0.85, sin(a), 0.38).normalized()
	var sy := sun_dir.y
	var dayk := smoothstep(-0.1, 0.22, sy)
	var dusk := clampf(1.0 - absf(sy - 0.05) / 0.36, 0.0, 1.0) * (1.0 if sy > -0.22 else 0.0)
	var light_dir := sun_dir if sy > -0.02 else Vector3(-sun_dir.x, maxf(-sy, 0.3), -sun_dir.z).normalized()
	sun.basis = Basis.looking_at(-light_dir, Vector3.UP)
	if sy > -0.02:
		sun.light_color = Color(1.0, 0.95, 0.88).lerp(Color(1.0, 0.62, 0.35), dusk * 0.85)
		sun.light_energy = 1.25 * smoothstep(-0.03, 0.12, sy)
	else:
		sun.light_color = Color(0.62, 0.72, 0.95)
		sun.light_energy = 0.45 * smoothstep(-0.02, -0.2, sy)
	var top_day := Color(0.22, 0.47, 0.85)
	var hor_day := Color(0.66, 0.8, 0.92)
	var top_n := Color(0.03, 0.06, 0.16)
	var hor_n := Color(0.09, 0.14, 0.27)
	var hor_dusk := Color(1.0, 0.55, 0.32)
	sky_mat.sky_top_color = top_n.lerp(top_day, dayk)
	sky_mat.sky_horizon_color = hor_n.lerp(hor_day, dayk).lerp(hor_dusk, dusk * 0.7)
	sky_mat.ground_horizon_color = sky_mat.sky_horizon_color
	sky_mat.ground_bottom_color = Color(0.03, 0.12, 0.18).lerp(Color(0.01, 0.03, 0.06), 1.0 - dayk)
	sky_mat.sky_energy_multiplier = lerpf(0.6, 1.0, dayk)
	env.fog_light_color = sky_mat.sky_horizon_color
	env.ambient_light_energy = lerpf(1.1, 1.0, dayk)
	env.tonemap_exposure = lerpf(2.2, 1.0, dayk)
	water_mat.set_shader_parameter("day", dayk)
	water_mat.set_shader_parameter("deep_color", Color(0.01, 0.04, 0.08).lerp(Color(0.02, 0.16, 0.26), dayk))
	water_mat.set_shader_parameter("shallow_color", Color(0.03, 0.12, 0.16).lerp(Color(0.09, 0.52, 0.5), dayk))

func _load_json(path: String) -> Dictionary:
	if not FileAccess.file_exists(path):
		push_error("Missing " + path)
		return {}
	var data = JSON.parse_string(FileAccess.get_file_as_string(path))
	return data if data is Dictionary else {}
