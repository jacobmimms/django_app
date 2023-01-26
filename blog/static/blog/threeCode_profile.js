const G = 32.81;
let camera_data = {direction: new THREE.Vector3(0,0,1), position: new THREE.Vector3(0, 5, 0), rot: new THREE.Vector3(0, 0, 0), vel: new THREE.Vector3(0, 0, 0), acc: new THREE.Vector3(0, 0, 0)}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({
	canvas: document.querySelector('#canvas-3d'),
});
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

camera.position.set(0, 10, 0);

const PlaneGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMaterial = new THREE.MeshStandardMaterial({color: 0xffffff});
const plane = new THREE.Mesh(PlaneGeometry, planeMaterial);
plane.rotation.x = -Math.PI/2;
scene.add(plane);

const geometry = new THREE.TorusKnotGeometry( 5, 1.5, 50, 16 );

const material = new THREE.MeshStandardMaterial( { color: 0xffffff});
const torus = new THREE.Mesh(geometry, material)
torus.translateZ(-100)
torus.translateY(15)
scene.add( torus );

const light = new THREE.PointLight(0xffffff, 20, 20);
light.position.set(0, 90, 0);
scene.add(light); 
const sphereSize = 1;
const pointLightHelper = new THREE.PointLightHelper( light, sphereSize );
scene.add( pointLightHelper );

scene.background = new THREE.Color(0x333333);

function resizeCanvasToDisplaySize() {
	const canvas = renderer.domElement;
	const width = canvas.clientWidth;
	const height = canvas.clientHeight;
	if (canvas.width !== width || canvas.height !== height) {
	  renderer.setSize(width, height, false);
	  camera.aspect = width / height;
	  camera.updateProjectionMatrix();
	}
}

(document).onclick = function(event) {
	let mouse = new THREE.Vector2();
	mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(event.clientY / window.innerHeight) * 2 + 1; 
	let raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);
	let intersects = raycaster.intersectObjects(scene.children);
	if (intersects.length > 0) {
		console.log(intersects)
		let object = intersects[0].object;
		let direction = new THREE.Vector3();
		direction.subVectors(object.position, camera.position).normalize();
		// calculte rotation around y axis to face object
		// calculate rotation around x axis to keep camera level
		// rotate camera
		camera_data.rot.y = Math.atan2(direction.x, direction.z) - Math.PI;
		// update position of camera to be on same vector as object
		camera_data.position.x = object.position.x - (direction.x * 10);
		camera_data.position.z = object.position.z - (direction.z * 10);
		
	}
}

$(document).keydown(function(event) {
	startMove(event);
})

$(document).keyup(function(event) {
	stopMove(event);
})

const startMove = function(input) {
	let key = input.key;
	inputs[key] = true;
}
const stopMove = function(input) {
	let key = input.key;
	inputs[key] = false;
}
const moveForward = function() {
	camera_data.position.x += camera_data.direction.x;
	camera_data.position.y += camera_data.direction.y;
	camera_data.position.z += camera_data.direction.z;
}
const moveBackward = function() {
	camera_data.position.x -= camera_data.direction.x;
	camera_data.position.y -= camera_data.direction.y;
	camera_data.position.z -= camera_data.direction.z;
}
const moveLeft = function() {
	camera_data.position.x += camera_data.direction.z;
	camera_data.position.z -= camera_data.direction.x;
}
const moveRight = function() {
	camera_data.position.x -= camera_data.direction.z;
	camera_data.position.z += camera_data.direction.x;
}
const moveUp = function() {
	camera_data.position.y += 1;
}
const moveDown = function() {
	camera_data.position.y -= 1;
}
const turnLeft = function() {
	camera_data.rot.y += .04;
}
const turnRight = function() {
	camera_data.rot.y -= .04;
}
const turnUp = function() {
	camera_data.rot.x += .04;
}
const turnDown = function() {
	//for what?
	camera_data.rot.x -= .04;
}
const jump = function() {
	camera_data.vel.y = 1;
}

const gravity = function(delta_time) {
	camera_data.position.y += camera_data.vel.y ;
	camera_data.vel.y += camera_data.acc.y ;
	camera_data.acc.y += (-G * (delta_time) * (delta_time));
	if (camera_data.position.y <= 5) {
		camera_data.acc.y = 0;
		camera_data.vel.y = 0;
		camera_data.position.y = 5;
	}
}

const handlePysics = function(delta_time) {
	gravity(delta_time)

}

const handleMovement = function(inputs, controls) {
	for (let key in inputs) {
		if (inputs[key]) {
			controls[key]();
		}
	}
}

let profile_picture_url = $(this).attr("profile_picture_url");
let texture = new THREE.TextureLoader().load(profile_picture_url);
let profile_material = new THREE.MeshBasicMaterial({map: texture});
let profile_geometry = new THREE.BoxGeometry(10, 10, 10)
let mesh = new THREE.Mesh(profile_geometry, profile_material);
mesh.position.set(0, 5, 0);
mesh.translateX(i * 20);
scene.add(mesh);
profile_picutes.push(mesh);


let controls = {"w": moveForward, "s": moveBackward, "a": moveLeft, "d": moveRight, "q":moveUp, "e": moveDown,  "ArrowLeft": turnLeft, "ArrowRight":turnRight, "ArrowUp": turnUp, "ArrowDown": turnDown,  " ": jump}
let inputs = {"w": false, "s": false, "a": false, "d":false, "q":false, "e":false, "ArrowLeft": false, "ArrowRight":false}
let start = Date.now()
let prev_time = start
let delta = Date.now() - prev_time;

function animate() {
	light.position.set(camera_data.position.x, camera_data.position.y + 10, camera_data.position.z);
	resizeCanvasToDisplaySize();
	delta = Date.now() - prev_time;
	prev_time = Date.now();
	handleMovement(inputs, controls);
	handlePysics(delta / 1000)
	camera.position.x = camera_data.position.x;
	camera.position.y = camera_data.position.y;
	camera.position.z = camera_data.position.z;
	camera.rotation.x = camera_data.rot.x;
	camera.rotation.y = camera_data.rot.y;
	camera.rotation.z = camera_data.rot.z;
	camera.getWorldDirection(camera_data.direction)
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}; 


animate();