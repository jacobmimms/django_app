// this class handles all user input for controlling the three.js camera
const G = 32.81;
export class CameraHandler {
    constructor(camera, light, room_size) {
        this.room_size = room_size;
        this.prev_time = Date.now();
        this.camera = camera;
        this.light = light;
        this.camera_data = {direction: new THREE.Vector3(0,0,1), position: new THREE.Vector3(0,50, 0), rot: new THREE.Vector3(0, 0, 0), vel: new THREE.Vector3(0, 0, 0), acc: new THREE.Vector3(0, 0, 0)}
        this.camera.getWorldDirection(this.camera_data.direction)
        this.camera_data.direction.multiplyScalar(10);
        this.inputs = { "w": false, "s": false, "a": false, "d":false, "q":false, "e":false, "ArrowLeft": false, "ArrowRight":false, "ArrowUp": false, "ArrowDown":false}

        this.controls = {parent:this,"w": this.moveForward, "s": this.moveBackward, "a": this.moveLeft, "d": this.moveRight, "q":this.moveUp, "e": this.moveDown,  "ArrowLeft": this.turnLeft, "ArrowRight":this.turnRight, "ArrowUp": this.turnAround, "ArrowDown": this.turnAround}
        this.speed = .35;
        document.addEventListener("keydown", (event) => {
            this.startKeypress(event);
        });
        document.addEventListener("keyup", (event) => {
            this.stopKeypress(event);
        });

    }
    step(delta) {
        this.pre_update_center = this.getRoomCenter();
        for (let key in this.inputs) {
            if (!this.controls.hasOwnProperty(key)) continue;
            if (this.inputs[key] == true) {
                this.controls[key]();
            }
        }
        this.handlePysics(delta / 1000)
        this.updateCamera();
        this.post_update_center = this.getRoomCenter();
        if (!this.pre_update_center.equals(this.post_update_center)) {
            console.log("room changed")
            return {room_change:{next_room: this.post_update_center, prev_room: this.pre_update_center}}
        }
        this.prev_time = Date.now();

    }

    updateCamera(){
        this.camera.position.x = this.camera_data.position.x;
        this.camera.position.y = this.camera_data.position.y;
        this.camera.position.z = this.camera_data.position.z;
        this.camera.rotation.x = this.camera_data.rot.x;
        this.camera.rotation.y = this.camera_data.rot.y;
        this.camera.rotation.z = this.camera_data.rot.z;
	    this.light.position.set(this.camera_data.position.x, this.camera_data.position.y + 10, this.camera_data.position.z);
        //this sets the camera to point in the direction of the camera_data.direction vector
        this.camera.getWorldDirection(this.camera_data.direction)


    }
    startKeypress(input) {
        this.inputs[input.key] = true;
    }
    stopKeypress(input) {
        this.inputs[input.key] = false;
    }
    registerNewInput(input, func) {
        this.inputs[input] = false;
        this.controls[input] = func;
    }
    moveForward() {
        // make the camera move forward by adding the direction vector to the position vector, but scaled by a speed factor
        this.parent.camera_data.position.x += this.parent.camera_data.direction.x * this.parent.speed;
        this.parent.camera_data.position.y += this.parent.camera_data.direction.y * this.parent.speed;
        this.parent.camera_data.position.z += this.parent.camera_data.direction.z * this.parent.speed;
    }
    
    moveBackward() {
        this.parent.camera_data.position.x -= this.parent.camera_data.direction.x * this.parent.speed;
        this.parent.camera_data.position.y -= this.parent.camera_data.direction.y * this.parent.speed;
        this.parent.camera_data.position.z -= this.parent.camera_data.direction.z * this.parent.speed;
    }
    moveLeft() {
        this.parent.camera_data.position.x += this.parent.camera_data.direction.z * this.parent.speed;
        this.parent.camera_data.position.z -= this.parent.camera_data.direction.x * this.parent.speed;
    } 
    moveRight() { 
        this.parent.camera_data.position.x -= this.parent.camera_data.direction.z * this.parent.speed;
        this.parent.camera_data.position.z += this.parent.camera_data.direction.x * this.parent.speed;
    }
    moveUp() {
        this.parent.camera_data.position.y += 1;
    }
    moveDown() {
        this.parent.camera_data.position.y -= 1;
    }
    turnLeft() {
        this.parent.camera_data.rot.y += .02;

    }
    turnRight() {
        this.parent.camera_data.rot.y -= .02;
    }
    turnAround() {
        // this.parent.camera_data.rot.y += Math.PI;
        // debounce this 
        // this.parent.camera_data.rot.y += Math.PI;

    }
    tiltUp() {
        let tilt = this.parent.camera_data.direction;
        let up = new THREE.Vector3(0, 1, 0);
        let [newDirection, newUp] = this.parent.tiltCamera(tilt, up);
        this.parent.camera_data.direction = newDirection;
        this.parent.camera_data.up = newUp;

    }
    tiltDown() {
        let tilt = this.parent.camera_data.direction;

    }
    tiltCamera(direction, up) {
        // Normalize the direction and up vectors
        direction.normalize();
        up.normalize();
      
        // Calculate the right vector
        const right = new THREE.Vector3();
        right.crossVectors(direction, up);
        right.normalize();
      
        // Calculate the new up vector
        const newUp = new THREE.Vector3();
        newUp.crossVectors(right, direction);
        newUp.normalize();
      
        // Calculate the angle between the current up vector and the new up vector
        const angle = up.angleTo(newUp);
      
        // Construct a rotation matrix around the right vector
        const rotation = new THREE.Matrix4();
        rotation.makeRotationAxis(right, angle);
        // Apply the rotation to the direction and up vectors
        direction.applyMatrix4(rotation);
        up.applyMatrix4(rotation);
      
        // Return the updated direction and up vectors
        return [direction, up];
      }

    gravity(delta_time) {
        let G = 9.8;
        // this.camera_data.position.y += this.camera_data.vel.y ;
        // this.camera_data.vel.y += this.camera_data.acc.y ;
        // this.camera_data.acc.y += (-G * (delta_time) * (delta_time));
        // if (this.camera_data.position.y <= 5) {
        //     this.camera_data.acc.y = 0;
        //     this.camera_data.vel.y = 0;
        //     this.camera_data.position.y = 5;
        // }
    }
    handlePysics(delta_time) {
        this.gravity(delta_time)
    }
    getRoomCenter() {
        let x = (Math.round(this.camera.position.x / this.room_size)).toString();
        let z = (Math.round(-this.camera.position.z / this.room_size)).toString();
        let current_room_center = new THREE.Vector3(x, 0, z);
        return current_room_center;
    }
}
