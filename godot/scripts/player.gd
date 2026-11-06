extends CharacterBody3D
## Third-person angler: WASD to move, Shift to run, Space to jump, swim in the sea.
## Drag with the mouse (or two-finger swipe on a trackpad) to orbit, scroll or pinch to zoom.
## The model is the exported angler; its joints are animated in code like the web game.

const WALK := 5.5
const RUN := 10.5
const SWIM := 3.6
const GRAVITY := 24.0
const JUMP := 8.5
const WATER_Y := -1.05
const LOWPOLY := preload("res://shaders/lowpoly.gdshader")

var cam_yaw := 0.0
var cam_pitch := 0.32
var cam_dist := 9.0
var camera: Camera3D
var model: Node3D
var joints := {}
var cur := {}
var anim_t := 0.0
var phase := 0.0
var face := 0.0
var swimming := false

func _ready() -> void:
	var col := CollisionShape3D.new()
	var cap := CapsuleShape3D.new()
	cap.radius = 0.38
	cap.height = 1.75
	col.shape = cap
	col.position.y = 0.875
	add_child(col)
	floor_snap_length = 0.6
	floor_max_angle = deg_to_rad(50)
	var scene: PackedScene = load("res://assets/angler.glb")
	model = scene.instantiate()
	add_child(model)
	var mat := ShaderMaterial.new()
	mat.shader = LOWPOLY
	mat.set_shader_parameter("roughness_amount", 0.75)
	_apply_mat(model, mat)
	for n in ["hips", "spine", "neck", "head", "armL", "armR", "elbowL", "elbowR", "legL", "legR", "kneeL", "kneeR", "body"]:
		var j := model.find_child(n, true, false)
		if j:
			joints[n] = j
	camera = Camera3D.new()
	camera.fov = 62.0
	camera.far = 2500.0
	camera.top_level = true
	add_child(camera)
	camera.make_current()

func _apply_mat(n: Node, mat: Material) -> void:
	if n is MeshInstance3D:
		(n as MeshInstance3D).material_override = mat
	for c in n.get_children():
		_apply_mat(c, mat)

func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventMouseMotion and (Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT) or Input.is_mouse_button_pressed(MOUSE_BUTTON_RIGHT)):
		cam_yaw -= event.relative.x * 0.006
		cam_pitch = clampf(cam_pitch + event.relative.y * 0.004, -0.25, 1.3)
	elif event is InputEventPanGesture:
		cam_yaw -= event.delta.x * 0.05
		cam_pitch = clampf(cam_pitch + event.delta.y * 0.03, -0.25, 1.3)
	elif event is InputEventMagnifyGesture:
		cam_dist = clampf(cam_dist / event.factor, 3.0, 40.0)
	elif event is InputEventMouseButton and event.pressed:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			cam_dist = clampf(cam_dist * 0.9, 3.0, 40.0)
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			cam_dist = clampf(cam_dist * 1.1, 3.0, 40.0)

func _physics_process(delta: float) -> void:
	var input := Vector2.ZERO
	if Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP): input.y -= 1.0
	if Input.is_key_pressed(KEY_S) or Input.is_key_pressed(KEY_DOWN): input.y += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT): input.x -= 1.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT): input.x += 1.0
	var fwd := Vector3(-sin(cam_yaw), 0.0, -cos(cam_yaw))
	var right := Vector3(cos(cam_yaw), 0.0, -sin(cam_yaw))
	var dir := (right * input.x - fwd * input.y)
	if dir.length() > 1.0:
		dir = dir.normalized()
	swimming = global_position.y < WATER_Y + 0.1 and not is_on_floor()
	var speed := SWIM if swimming else (RUN if Input.is_key_pressed(KEY_SHIFT) else WALK)
	var target := dir * speed
	var k := 1.0 - exp(-(10.0 if is_on_floor() else 3.0) * delta)
	velocity.x = lerpf(velocity.x, target.x, k)
	velocity.z = lerpf(velocity.z, target.z, k)
	if swimming:
		velocity.y = lerpf(velocity.y, (WATER_Y - global_position.y) * 4.0, 1.0 - exp(-6.0 * delta))
	else:
		velocity.y -= GRAVITY * delta
	if Input.is_key_pressed(KEY_SPACE) and (is_on_floor() or swimming):
		velocity.y = JUMP
	move_and_slide()
	if global_position.y < -40.0:
		global_position.y = 5.0
	if dir.length() > 0.05:
		face = lerp_angle(face, atan2(dir.x, dir.z), 1.0 - exp(-12.0 * delta))
	model.rotation.y = face
	var flat_speed := Vector2(velocity.x, velocity.z).length()
	_animate(delta, flat_speed)
	_update_camera(delta)

func _update_camera(_delta: float) -> void:
	var tgt := global_position + Vector3(0, 1.6, 0)
	var off := Vector3(sin(cam_yaw) * cos(cam_pitch), sin(cam_pitch), cos(cam_yaw) * cos(cam_pitch)) * cam_dist
	var want := tgt + off
	var q := PhysicsRayQueryParameters3D.create(tgt, want)
	q.exclude = [get_rid()]
	var hit := get_world_3d().direct_space_state.intersect_ray(q)
	if hit:
		want = hit.position + (tgt - want).normalized() * 0.3
	camera.global_position = want
	camera.look_at(tgt, Vector3.UP)

func _animate(delta: float, spd: float) -> void:
	anim_t += delta
	var t := anim_t
	var T := {"bodyY": 0.0, "lean": 0.0, "hipsRY": 0.0, "spX": 0.02 + sin(t * 1.8) * 0.012, "twist": 0.0, "nX": 0.0,
		"sLx": 0.05 + sin(t * 0.9) * 0.03, "sLz": -0.1, "eL": -0.2, "sRx": 0.05 + sin(t * 0.9 + 1.0) * 0.03, "sRz": 0.1, "eR": -0.2,
		"hL": 0.0, "kL": 0.0, "hR": 0.0, "kR": 0.0}
	var s := clampf(spd / 6.5, 0.0, 1.0)
	if swimming:
		phase += delta * 5.0
		var sw := sin(phase)
		T["lean"] = 1.15
		T["bodyY"] = -0.9
		T["sLx"] = -2.6 + sw * 1.2
		T["sRx"] = -2.6 - sw * 1.2
		T["sLz"] = -0.5
		T["sRz"] = 0.5
		T["hL"] = sw * 0.45
		T["hR"] = -sw * 0.45
		T["kL"] = 0.3
		T["kR"] = 0.3
		T["nX"] = -0.9
	elif not is_on_floor():
		T["hL"] = -0.7; T["kL"] = 1.1; T["hR"] = 0.25; T["kR"] = 0.5
		T["sLz"] = -0.6; T["sRz"] = 0.6; T["sLx"] = -0.4; T["sRx"] = -0.4
	elif s > 0.04:
		var rn := smoothstep(8.5, 11.5, spd)
		phase += delta * spd * lerpf(1.4, 1.05, rn)
		var sw := sin(phase)
		var cs := sin(phase + 1.7)
		var A := lerpf(0.62, 1.02, rn) * s
		var K := lerpf(0.95, 1.7, rn) * s
		var AR := lerpf(0.5, 1.1, rn) * s
		T["hL"] = -sw * A; T["hR"] = sw * A
		T["kL"] = 0.08 + maxf(0.0, cs) * K; T["kR"] = 0.08 + maxf(0.0, -cs) * K
		T["sLx"] = sw * AR; T["sRx"] = -sw * AR
		T["eL"] = lerpf(-0.25, -1.4, rn) * s - 0.15; T["eR"] = T["eL"]
		T["sLz"] = -0.1 - rn * 0.12; T["sRz"] = 0.1 + rn * 0.12
		T["bodyY"] = absf(cos(phase)) * lerpf(0.06, 0.16, rn) * s
		T["lean"] = lerpf(0.07, 0.3, rn) * s
		T["hipsRY"] = sw * lerpf(0.12, 0.2, rn) * s
		T["twist"] = -sw * lerpf(0.1, 0.24, rn) * s
		T["nX"] = -T["lean"] * 0.45
	else:
		var w := sin(t * 0.55)
		T["hipsRY"] = w * 0.06; T["twist"] = -w * 0.04
		T["kL"] = maxf(0.0, w) * 0.12; T["kR"] = maxf(0.0, -w) * 0.12
		T["hL"] = -maxf(0.0, w) * 0.05; T["hR"] = -maxf(0.0, -w) * 0.05
	var k := 1.0 - exp(-14.0 * delta)
	for key in T:
		cur[key] = lerpf(cur.get(key, T[key]), T[key], k)
	_rot("body", "x", cur["lean"])
	if joints.has("body"):
		joints["body"].position.y = cur["bodyY"]
	_rot("hips", "y", cur["hipsRY"])
	_rot("spine", "x", cur["spX"]); _rot("spine", "y", cur["twist"])
	_rot("neck", "x", cur["nX"])
	_rot("armL", "x", cur["sLx"]); _rot("armL", "z", cur["sLz"]); _rot("elbowL", "x", cur["eL"])
	_rot("armR", "x", cur["sRx"]); _rot("armR", "z", cur["sRz"]); _rot("elbowR", "x", cur["eR"])
	_rot("legL", "x", cur["hL"]); _rot("kneeL", "x", cur["kL"])
	_rot("legR", "x", cur["hR"]); _rot("kneeR", "x", cur["kR"])

func _rot(j: String, axis: String, v: float) -> void:
	if not joints.has(j):
		return
	var n: Node3D = joints[j]
	match axis:
		"x": n.rotation.x = v
		"y": n.rotation.y = v
		"z": n.rotation.z = v
