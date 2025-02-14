var peer;
var myStream;

/**
 * Initializes PeerJS and requests webcam/microphone access
 */
function register() {
    var name = document.getElementById('name').value.trim();

    if (!name) {
        console.error('Le nom ne peut pas être vide');
        return;
    }

    peer = new Peer(name, {
        host: 'peerjs-server.herokuapp.com', // Reliable public PeerJS server
        port: 443,
        secure: true,
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' }, // STUN server for NAT traversal
                {
                    urls: 'turn:your-turn-server.com:3478',
                    username: 'user',
                    credential: 'password'
                }
            ]
        }
    });

    peer.on('open', function (id) {
        console.log('Mon ID Peer:', id);
    });

    peer.on('error', function (err) {
        console.error("Erreur PeerJS:", err);
    });

    // Get user media (video/audio)
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function (stream) {
            myStream = stream;
            ajoutVideo(stream, true);

            document.getElementById('register').style.display = 'none';
            document.getElementById('userAdd').style.display = 'block';
            document.getElementById('userShare').style.display = 'block';

            // Handle incoming calls
            peer.on('call', function (call) {
                console.log("Appel reçu !");
                call.answer(myStream); // Answer call with our stream
                call.on('stream', function (remoteStream) {
                    console.log("Flux vidéo distant reçu !");
                    ajoutVideo(remoteStream);
                });
                call.on('error', function (err) {
                    console.error("Erreur d'appel:", err);
                });
            });

        })
        .catch(function (err) {
            console.error('Erreur lors de l\'accès à la caméra/micro:', err);
        });
}

/**
 * Calls another user
 */
function appelUser() {
    var remotePeerId = document.getElementById('add').value.trim();
    document.getElementById('add').value = "";

    if (!remotePeerId) {
        console.error('Veuillez entrer un ID utilisateur valide');
        return;
    }

    console.log("Appel en cours vers:", remotePeerId);
    var call = peer.call(remotePeerId, myStream);

    if (!call) {
        console.error("L'appel n'a pas pu être établi");
        return;
    }

    call.on('stream', function (remoteStream) {
        console.log("Flux distant reçu !");
        ajoutVideo(remoteStream);
    });

    call.on('error', function (err) {
        console.error("Erreur lors de l'appel:", err);
    });
}

/**
 * Adds a video stream to the participants' section
 * @param {MediaStream} stream - The video stream to add
 * @param {boolean} isLocal - If true, mutes the video to prevent audio feedback
 */
function ajoutVideo(stream, isLocal = false) {
    try {
        var video = document.createElement('video');
        video.autoplay = true;
        video.controls = true;
        video.srcObject = stream;
        if (isLocal) video.muted = true; // Prevents local audio feedback

        document.getElementById('participants').appendChild(video);
    } catch (error) {
        console.error("Erreur lors de l'ajout de la vidéo:", error);
    }
}

/**
 * Shares the user's screen with another peer
 */
function addScreenShare() {
    var remotePeerId = document.getElementById('share').value.trim();
    document.getElementById('share').value = "";

    if (!remotePeerId) {
        console.error('Veuillez entrer un ID utilisateur valide');
        return;
    }

    navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true })
        .then((stream) => {
            console.log("Partage d'écran en cours vers:", remotePeerId);
            let call = peer.call(remotePeerId, stream);

            if (!call) {
                console.error("Échec de l'appel pour le partage d'écran");
                return;
            }

            call.on('stream', function (remoteStream) {
                console.log("Flux de partage d'écran reçu !");
                ajoutVideo(remoteStream);
            });

            call.on('error', function (err) {
                console.error("Erreur de partage d'écran:", err);
            });
        })
        .catch((err) => {
            console.error('Échec du partage d\'écran:', err);
        });
}