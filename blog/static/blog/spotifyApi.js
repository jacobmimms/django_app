class SpotifyApi {
    constructor(access_token, refresh_token, failure_url) {
        this.access_token = access_token
        this.refresh_token = refresh_token
        this.api_url = 'https://api.spotify.com/v1/'
    }

    setDeviceId(device_id) {
        this.device_id = device_id
    }

    setPlayer(player) {
        this.player = player
        this.transferPlayback(this.device_id, true)
        this.player.activateElement().then( 
            () => {
                console.log("activated")
            }
        )
    }

    async togglePlay() {
        if (!this.player) {
            return "User is not playing music through the Web Playback SDK"
        } else {
            this.player.togglePlay().then(() => {
                console.log('Toggled playback!');
            }).catch((err) => {
                console.log(err)
            })
        }
    }

    async playSong(song_id, timestamp) {
        return new Promise(resolve => {
            console.log("playing song", song_id, "at timestamp", timestamp)
            $.ajax({
                url: `${this.api_url}me/player/play`,
                type: 'PUT',
                data: JSON.stringify({
                    "uris": [`spotify:track:${song_id}`],
                    "position_ms": timestamp
                }),
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    console.log(response, "song played")
                    resolve(response)
                },
                error: (response) => {
                    console.log(response, "song play failed")
                    resolve(response)
                }
            })
        })
    }

    transferPlayback(device_id) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}me/player`,
                type: 'PUT',
                data: JSON.stringify({
                    "device_ids": [device_id],
                    "play": true
                }),
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    console.log(response, "transfered playback")
                    resolve(response)
                },
                error: (response) => {
                    console.log(response, "transfered playback")
                    resolve(response)
                }
            })
        })
    }

    async getPlaybackState() {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}me/player`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }

    async getCurrentlyPlaying() {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}me/player/currently-playing`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }
    
    async getRecommendations(seed_tracks, seed_artists, seed_genres, limit) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}recommendations?seed_tracks=${seed_tracks}&seed_artists=${seed_artists}&seed_genres=${seed_genres}&limit=${limit}`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }

    async getFavoriteSongs(limit) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}me/tracks?limit=${limit}`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    console.log(response, "favorite songs")
                    resolve(response)
                },
                error: (response) => {
                    console.log(response, "favorite songs")
                    resolve(response)
                }
            })
        })
    }

    async getRecommendationsFromSong(seed_tracks, limit, max_tempo, min_tempo, max_danceability, min_danceability, max_energy, min_energy, max_valence, min_valence) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}recommendations?seed_tracks=${seed_tracks}&limit=${limit}`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    console.log(response)
                    resolve(response)
                },
                error: (response) => {
                    console.log(response)
                    resolve(response)
                }
            })
        })
    }
    
    async getTrack(track_id) {
        return new Promise(resolve => {
            $.ajax({
                url: `${this.api_url}tracks/${track_id}`,
                type: 'GET',
                beforeSend: (xhr) => {
                    xhr.setRequestHeader('Authorization', `Bearer ${this.access_token}`);
                },
                success: (response) => {
                    resolve(response)
                },
                error: (response) => {
                    resolve(response)
                }
            })
        })
    }
}