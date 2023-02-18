import {CameraHandler} from './cameraHandler.js';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({canvas: document.querySelector('#canvas-3d'),});
renderer.domElement.style.width = '100%';
renderer.domElement.style.height = '100%';
camera.position.set(0, 10, 0);
const PlaneGeometry = new THREE.PlaneGeometry(1000, 1000);
const planeMaterial = new THREE.MeshStandardMaterial({color: 0xffffff});
const plane = new THREE.Mesh(PlaneGeometry, planeMaterial);
plane.rotation.x = -Math.PI/2;
scene.add(plane);

function makeRoom(x, y, size, url) {
	const room = new THREE.Group();	
	let light_color = 0xffffff;
	const opening_size = size / 4;
	const center_light = new THREE.PointLight(light_color, 1, size, 1);
	center_light.position.set(x, size/2, -y);
	room.add(center_light);

	const ceiling = new THREE.Mesh(new THREE.BoxGeometry(size, 1, size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	ceiling.translateX(x)
	ceiling.translateY(size);
	ceiling.translateZ(-y);
	room.add(ceiling);

	const wall_size = size - opening_size/2;

	const front_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_size, size, 1), new THREE.MeshStandardMaterial({color: 0x61faff}));
	front_wall.translateX(x);
	front_wall.translateZ(-y + size/2);
	front_wall.translateY(size/2);
	front_wall.material.map = new THREE.TextureLoader().load(url);	
	room.add(front_wall);

	const back_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_size, size, 1), new THREE.MeshStandardMaterial({color: 0x61faff}));
	back_wall.translateX(x);
	back_wall.translateZ(-y - size/2);
	back_wall.translateY(size/2);
	back_wall.material.map = new THREE.TextureLoader().load(url);
	room.add(back_wall);

	const left_wall = new THREE.Mesh(new THREE.BoxGeometry(1, size, wall_size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	left_wall.translateX(x - size/2);
	left_wall.translateZ(-y);
	left_wall.translateY(size/2);
	left_wall.material.map = new THREE.TextureLoader().load(url);
	room.add(left_wall);

	const right_wall = new THREE.Mesh(new THREE.BoxGeometry(1, size, wall_size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	right_wall.translateX(x + size/2);
	right_wall.translateZ(-y);
	right_wall.translateY(size/2);
	right_wall.material.map = new THREE.TextureLoader().load(url);
	room.add(right_wall);

	const floor = new THREE.Mesh(new THREE.BoxGeometry(size, 1, size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	floor.translateX(x);
	floor.translateZ(-y);
	floor.translateY(.5);
	room.add(floor);
	return room;
}

const follow_light = new THREE.PointLight(0x420420, 1, 15);
follow_light.position.set(0, 90, 0);

scene.add(follow_light); 
const sphereSize = 1;


scene.background = new THREE.Color(0x444444);

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

let room_size = 100;
const userObject = new CameraHandler(camera, follow_light)
const clock = new THREE.Clock();


function adjacentRooms(current_room_center) {
	let adjacent_rooms = [];
	for (let x = -1; x <= 1; x++) {
		for (let z = -1; z <= 1; z++) {
			if (x == 0 && z == 0) {
				continue;
			}
			adjacent_rooms.push(new THREE.Vector3(current_room_center.x + x, current_room_center.y, current_room_center.z + z));
		}
	}
	return adjacent_rooms;
}

function addRoom(rooms, x_index, z_index, x, z, room_size, url) {
	console.log("add room url", url)
	let room = makeRoom(x, z, room_size, url);
	scene.add(room);
	if (rooms[x_index] == undefined) {
		rooms[x_index] = {};
	}
	rooms[x_index][z_index] = {room: room, loaded: true};
}

function loadRooms(rooms) {
	let x  = (Math.round(camera.position.x / room_size)).toString();
	let z =  (Math.round(-camera.position.z / room_size)).toString();
	console.log()
	let current_room_center = new THREE.Vector3(x, 0, z);
	if (rooms[x] == undefined || rooms[x][z] == undefined && rooms[x][z]?.loaded != true) {
		let room_x = current_room_center.x * room_size
		let room_y = current_room_center.z * room_size
		getPlaybackState().then((data) => {
			let current_song = data.track_window.next_tracks[0];
			let song_title = current_song.name;
			let song_artist = current_song.artists[0].name;
			let song_album = current_song.album.name;
			let song_image = current_song.album.images[0].url;
			addRoom(rooms, x, z, room_x, room_y, room_size, song_image);
		}).catch((err) => {
			addRoom(rooms, x, z, room_x, room_y, room_size, "nothing");
			console.log("err", err)})
		nextSong()

	}
	return rooms;
}
let rooms = {};
function animate() {
	rooms = loadRooms(rooms); 
	resizeCanvasToDisplaySize();
	userObject.step(clock.getDelta());
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}; 
animate();