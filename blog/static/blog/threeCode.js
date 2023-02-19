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

function makeRoom(center) {
	let url = "none";
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
	// front_wall.material.map = new THREE.TextureLoader().load(url);	
	room.add(front_wall);

	const back_wall = new THREE.Mesh(new THREE.BoxGeometry(wall_size, size, 1), new THREE.MeshStandardMaterial({color: 0x61faff}));
	back_wall.translateX(x);
	back_wall.translateZ(y - size/2);
	back_wall.translateY(size/2);
	back_wall.isSideWall = true;
	// back_wall.material.map = new THREE.TextureLoader().load(url);
	room.add(back_wall);

	const left_wall = new THREE.Mesh(new THREE.BoxGeometry(1, size, wall_size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	left_wall.translateX(x - size/2);
	left_wall.translateZ(y);
	left_wall.translateY(size/2);
	left_wall.isSideWall = true;
	// left_wall.material.map = new THREE.TextureLoader().load(url);
	room.add(left_wall);

	const right_wall = new THREE.Mesh(new THREE.BoxGeometry(1, size, wall_size), new THREE.MeshStandardMaterial({color: 0x61faff}));
	right_wall.translateX(x + size/2);
	right_wall.translateZ(y);
	right_wall.translateY(size/2);
	// right_wall.material.map = new THREE.TextureLoader().load(url);
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

class RoomLoader{
	constructor() {
		this.rooms = {};
		this.room_data = {};
		this.current_room_center = new THREE.Vector3(0, 0, 0);
		this.prev_room_center = new THREE.Vector3(0, 0, 0);		
	}

	loadRoom(room_center, is_current) {
		let x_index = room_center.x.toString();
		let z_index = room_center.z.toString();
		if (this.rooms[x_index] != undefined && this.rooms[x_index][z_index] != undefined) {
			// room already loaded
			this.rooms[x_index][z_index].current_room = is_current;
			return;
		}
		let room = makeRoom(room_center);
		if (this.rooms[x_index] == undefined) {this.rooms[x_index] = {};}
		this.rooms[x_index][z_index] = {current_room: is_current, room: room};
		scene.add(room);
	}

	addRooms() {
		this.loadRoom(this.current_room_center, true);
		let adjacent_room_centers = this.getAdjacentRoomCenters();
		for (let room_center of adjacent_room_centers) {
			this.loadRoom(room_center, false);
		}
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

	updateRooms() {
		this.addRooms();
	}

	init_data(room_center) {
		let x_index = room_center.x.toString();
		let z_index = room_center.z.toString();
		if (this.room_data[x_index] == undefined) {
			this.room_data[x_index] = {};
		}
		if (this.room_data[x_index][z_index] == undefined) {
			this.room_data[x_index][z_index] = {};
		}
	}

	savePlaybackState(room_center, song_id, song_name, artist_name, timestamp, album_art_url) {
		let x_index = room_center.x.toString();
		let z_index = room_center.z.toString();
		if (this.room_data[x_index] == undefined || this.room_data[x_index][z_index] == undefined) {
			this.init_data(room_center);
		}
		this.room_data[x_index][z_index].song_id = song_id;
		this.room_data[x_index][z_index].song_name = song_name;
		this.room_data[x_index][z_index].artist_name = artist_name;
		this.room_data[x_index][z_index].timestamp = timestamp;
		this.room_data[x_index][z_index].album_art_url = album_art_url;
	}
	
	async handleRoomExit(room_center) {
		let x_index = room_center.x.toString();
		let z_index = room_center.z.toString();
		if (this.room_data[x_index] == undefined || this.room_data[x_index][z_index] == undefined) {
			this.init_data(room_center);
			return;
		}
		let song_info = await getPlaybackState();
		console.log(song_info);
		let timestamp = song_info.position;
		let song_id = song_info.track_window.current_track.id;
		let song_name = song_info.track_window.current_track.name;
		let artist_name = song_info.track_window.current_track.artists[0].name;
		let album_art_url = song_info.track_window.current_track.album.images[0].url;
		this.savePlaybackState(this.prev_room_center, song_id, song_name, artist_name, timestamp, album_art_url);
	}

	async handleRoomEnter(prev_room_center, room_center) {
		let prev_x_index = prev_room_center.x.toString();
		let prev_z_index = prev_room_center.z.toString();
		let x_index = room_center.x.toString();
		let z_index = room_center.z.toString();

		this.rooms[x_index][z_index].is_current = true;
		if (this.room_data[x_index] == undefined || this.room_data[x_index][z_index] == undefined) {
			// if room has not been visited before, play a random song
			this.init_data(room_center);
			let recommendations = await window.spotifyApi.getFavoriteSongs(1)
			let song_id = recommendations.items[0].track.id;
			let next_recommendation = await window.spotifyApi.getRecommendationsFromSong(song_id, 1);
			song_id = next_recommendation.tracks[0].id;
			let song_name = next_recommendation.tracks[0].name;
			let artist_name = next_recommendation.tracks[0].artists[0].name;
			let album_art_url = next_recommendation.tracks[0].album.images[0].url;
			await window.spotifyApi.playSong(song_id, 0);
			console.log("albumn art url: " + album_art_url)
			this.updateDisplay(song_name, artist_name, album_art_url)
		} else {
			let song_id = this.room_data[x_index][z_index].song_id;
			let song_name = this.room_data[x_index][z_index].song_name;
			let artist_name = this.room_data[x_index][z_index].artist_name;
			let album_art_url = this.room_data[x_index][z_index].album_art_url;
			console.log("albumn art url: " + album_art_url)
			this.updateDisplay(song_name, artist_name, album_art_url)
			let timestamp = this.room_data[x_index][z_index].timestamp;
			await window.spotifyApi.playSong(song_id, timestamp);
		}
	}

	updateDisplay(song_name, artist_name, album_art_url) {
		document.getElementById("player-track-name").innerHTML = song_name;
		document.getElementById("player-track-artist").innerHTML = artist_name;
		// get the currewnt room 
		let current_room = this.rooms[this.current_room_center.x.toString()][this.current_room_center.z.toString()].room;
		// get the walls from the current room threejs Group 
		let room_children = current_room.children.filter(child => child?.isMesh);	
		for (let wall of room_children) { 
			wall.material.map = new THREE.TextureLoader().load(album_art_url);
			wall.material.side = THREE.DoubleSide;
			wall.material.needsUpdate = true;

			console.log(wall)

		}

	}

	async handleEvent(event) {
		if (event?.room_change) {
			this.prev_room_center = event.room_change.prev_room;
			this.current_room_center = event.room_change.next_room;
			this.updateRooms();
			this.handleRoomExit(this.prev_room_center);
			this.handleRoomEnter(this.prev_room_center, this.current_room_center);
		}
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