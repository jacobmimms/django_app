const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({
	canvas: document.querySelector('#canvas-3d'),
});
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';

const axesHelper = new THREE.AxesHelper( 5 );
scene.add( axesHelper );

camera.position.set(0, 5, 0);

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

const light = new THREE.PointLight(0xffffff, 20, 100);
light.position.set(0, 90, );
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
	console.log(key)
	console.log(inputs[key])
}

const stopMove = function(input) {
	let key = input.key;
	inputs[key] = false;
	console.log(key)
	console.log(inputs[key])
}

const moveForward = function() {
	camera.position.z -= 1;
}
const moveBackward = function() {
	camera.position.z += 1;
}
const moveLeft = function() {
	camera.position.x -= 1;
}
const moveRight = function() {
	camera.position.x += 1;
}
const moveUp = function() {
	camera.position.y += 1;
}
const moveDown = function() {
	camera.position.y -= 1;
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
function animate() {
	resizeCanvasToDisplaySize();
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
	torus.rotateOnAxis(new THREE.Vector3(0, 0, 1), 0.01);
	handleMovement(inputs, controls);
};


animate();