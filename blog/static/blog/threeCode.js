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

function uuidv4() {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
	  (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
	);
  }

function makeRoom(center, art_url) {
	let url = art_url;
	let size = 100;
	let opening_size = size / 4;
	let x = parseInt(center.x) * size;
	let y = -parseInt(center.z) * size;
	const wall_size = size - opening_size/2;
	let light_color = 0xffffff;

	const room = new THREE.Group();	
	const center_light = new THREE.PointLight(light_color, 1, size, 1);
	center_light.position.set(x, size/2, y);
	room.add(center_light);

	const ceiling = new THREE.Mesh(new THREE.BoxGeometry(size, 1, size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	ceiling.translateX(x)
	ceiling.translateY(size);
	ceiling.translateZ(y);
	ceiling.isSideWall = false;
	room.add(ceiling);

	const front_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_size, size, 1), new THREE.MeshStandardMaterial({color: 0x61faff}));
	front_wall.translateX(x);
	front_wall.translateZ(y + size/2);
	front_wall.translateY(size/2);
	front_wall.isSideWall = true;
	front_wall.material.map = new THREE.TextureLoader().load(url);	
	room.add(front_wall);

	const back_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_size, size, 1), new THREE.MeshStandardMaterial({color: 0x61faff}));

	back_wall.translateX(x);
	back_wall.translateZ(y - size/2);
	back_wall.translateY(size/2);
	back_wall.isSideWall = true;
	back_wall.material.map = new THREE.TextureLoader().load(url);
	room.add(back_wall);

	const left_wall = new THREE.Mesh(new THREE.BoxGeometry(1, size, wall_size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	left_wall.translateX(x - size/2);
	left_wall.translateZ(y);
	left_wall.translateY(size/2);
	left_wall.isSideWall = true;
	left_wall.material.map = new THREE.TextureLoader().load(url);
	room.add(left_wall);

	const right_wall = new THREE.Mesh(new THREE.BoxGeometry(1, size, wall_size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	right_wall.translateX(x + size/2);
	right_wall.translateZ(y);
	right_wall.translateY(size/2);
	right_wall.material.map = new THREE.TextureLoader().load(url);
	right_wall.isSideWall = true;
	room.add(right_wall);

	const floor = new THREE.Mesh(new THREE.BoxGeometry(size, 1, size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	floor.translateX(x);
	floor.translateZ(y);
	floor.translateY(.5);
	room.add(floor);
	floor.isSideWall = false;
	return room;
}

const follow_light = new THREE.PointLight(0x420420, 1, 15);
follow_light.position.set(0, 90, 0);
scene.add(follow_light); 
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

class Room {
	constructor(x, y, url, song_name = "", artist_name = "", song_id = "", timestamp = 0, current_room = false) {
		this.id = uuidv4();
		this.x = x;
		this.y = y;
		this.url = url;
		this.scene = scene;
		this.room_center = new THREE.Vector3(x, 0, y);
		this.room = makeRoom(this.room_center, url);
		this.song_name = song_name;
		this.artist_name = artist_name;
		this.song_id = song_id;
		this.timestamp = timestamp; 
		this.current_room = current_room;
	}

	getRecommendations() {
		return this.recommendations;
	}
}

class RoomLoader{
	constructor() {
		this.center_to_room_id = {};
		this.room = {};
		this.prev_room;
		this.current_room;
		this.load_first_room().then(
			(room) => {
				this.current_room = room;
				this.room[room.id] = room;
				this.center_to_room_id[room.room_center] = room.id;
				let current_room_center = room.room_center;
				this.center_to_room_id[current_room_center.toArray().toString()] = room.id;
				scene.add(room.room)
			}
		)
	}

	async load_first_room() {
		let songs = await window.spotifyApi.getFavoriteSongs(20);
		let random_song = songs.items[Math.floor(Math.random() * 20)].track; 
		let song_id = random_song.id;
		let song_name = random_song.name;
		let artist_name = random_song.artists[0].name;
		let album_art_url = random_song.album.images[0].url;

		let new_room = new Room(0, 0, album_art_url, song_name, artist_name, song_id, 0, true);
		return new_room;
	}

	
	getAdjacentRoomCenters() {
		let adjacent_room_centers = [];
		for (let x = -1; x <= 1; x++) {
			for (let z = -1; z <= 1; z++) {
				if (x == 0 && z == 0) {
					continue;
				}
				adjacent_room_centers.push(new THREE.Vector3(parseInt(this.current_room_center.x) + x, parseInt(this.current_room_center.y), parseInt(this.current_room_center.z) + z));
			}
		}
		return adjacent_room_centers;
	}

	savePlaybackState(room, song_id, song_name, artist_name, timestamp, album_art_url) {
		room.song_id = song_id;
		room.song_name = song_name;
		room.artist_name = artist_name;
		room.timestamp = timestamp;
		room.url = album_art_url;
	}

	updateDisplay(song_name, artist_name, album_art_url) {
		document.getElementById("player-track-name").innerHTML = song_name;
		document.getElementById("player-track-artist").innerHTML = artist_name;
		document.getElementById("player-track-image").setAttribute("src", album_art_url);
	}
	
	async handleRoomExit() {
		let song_info = await getPlaybackState();
		let timestamp = song_info.position;
		let current_room = this.room[this.current_room.id];
		current_room.timestamp = timestamp;
		this.prev_room = current_room;
	}

	getRoomOrNull(room_center) {
		if (this.center_to_room_id[room_center.toArray().toString()]) {
			return this.room[this.center_to_room_id[room_center.toArray().toString()]];
		}
		return null;
	}

	async handleRoomEnter() {
		let current_room = this.getRoomOrNull(this.current_room_center);
		if (current_room != null) {
			this.current_room = current_room;
			let timestamp = current_room.timestamp;
			await window.spotifyApi.playSong(current_room.song_id, timestamp);
			this.updateDisplay(current_room.song_name, current_room.artist_name, current_room.url);
		} else {
			let prev_song_id = this.room[this.prev_room.id].song_id
			let new_song = await window.spotifyApi.getRecommendationsFromSong(prev_song_id, 1);
			let song_id = new_song.tracks[0].id;
			let song_name = new_song.tracks[0].name;
			let artist_name = new_song.tracks[0].artists[0].name;
			let album_art_url = new_song.tracks[0].album.images[0].url;
			let timestamp = 0;
			let new_room = new Room(this.current_room_center.x, this.current_room_center.z, album_art_url, song_name, artist_name, song_id, timestamp);
			this.room[new_room.id] = new_room;
			this.center_to_room_id[this.current_room_center.toArray().toString()] = new_room.id
			this.current_room = new_room;
			this.updateDisplay(song_name, artist_name, album_art_url)
			scene.add(new_room.room)
			await window.spotifyApi.playSong(this.current_room.song_id, timestamp);
		}
	}

	async handleEvent(event) {
		if (event?.room_change) {
			this.prev_room_center = event.room_change.prev_room;
			this.current_room_center = event.room_change.next_room;
			this.prev_room = this.currrent_room;
			this.handleRoomExit(this.prev_room_center).then(() => {
				console.log("exited room")
				this.handleRoomEnter(this.current_room_center).then(() => {
					console.log("entered room")
				});
			});
		}
	}

	getRoom() {
		return this.room[this.center_to_room_id[this.current_room_center.toArray().toString()]];
	}
}

let room_size = 100;
const userObject = new CameraHandler(camera, follow_light, room_size);
const room_loader = new RoomLoader();
const clock = new THREE.Clock();
function animate() {
	resizeCanvasToDisplaySize();
	room_loader.handleEvent(userObject.step(clock.getDelta()));
	renderer.render( scene, camera );
	requestAnimationFrame( animate );
}; 
animate();