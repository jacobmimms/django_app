const G = 32.81;
let camera_data = {position: new THREE.Vector3(0, 5, 0), rot: new THREE.Vector3(0, 0, 0), vel: new THREE.Vector3(0, 0, 0), acc: new THREE.Vector3(0, 0, 0)}

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
	camera_data.position.z -= 1;
}
const moveBackward = function() {
	camera_data.position.z += 1;
}
const moveLeft = function() {
	camera_data.position.x -= 1;
}
const moveRight = function() {
	camera_data.position.x += 1;
}
const moveUp = function() {
	camera_data.position.y += 1;
}
const moveDown = function() {
	camera_data.position.y -= 1;
}
const gravity = function(delta_time) {
	if (camera_data.position.y <= 5) {
		camera_data.acc.y = 0;
		camera_data.vel.y = 0;
		camera_data.position.y = 5;
	}
	camera_data.position.y += camera_data.vel.y ;
	camera_data.vel.y += camera_data.acc.y ;
	camera_data.acc.y += (-G * (delta_time) * (delta_time) );
}

const handlePysics = function(delta_time) {
	gravity(delta_time)
	if (camera_data.position.y < 5) {
		camera_data.position.y = 5;
	}
}

const handleMovement = function(inputs, controls) {
	for (let key in inputs) {
		if (inputs[key]) {
			controls[key]();
		}
	}
}

let controls = {"w": moveForward, "s": moveBackward, "a": moveLeft, "d": moveRight, "q":moveUp, "e": moveDown}
let inputs = {"w": false, "s": false, "a": false, "d":false, "q":false, "e":false}
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

	console.log(camera.position)
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}; 


animate();