'use strict';

var usernamePage = document.querySelector('#username-page');
var chatPage = document.querySelector('#chat-page');
var usernameForm = document.querySelector('#usernameForm');
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageArea');
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var username = null;


var globalTopic = "/topic/public";

var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5652',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];

function connect(event) {
    username = document.querySelector('#name').value.trim();

    if(username) {
        usernamePage.classList.add('hidden');
        chatPage.classList.remove('hidden');

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, onConnected, onError);
    }
    event.preventDefault();
}


function onConnected() {
    // Subscribe to the Public Topic
    stompClient.subscribe('/topic/public', onMessageReceived);

    // Tell your username to the server
    stompClient.send("/app/chat.addUser",
        {},
        JSON.stringify({sender: username, type: 'JOIN'})
    )

    connectingElement.classList.add('hidden');
    // var testJson = {"type":"CHAT","content":"fef","sender":"kure"};
    // onMessageReceived(testJson);

		var xhr = new XMLHttpRequest();
		xhr.open("POST", "http://192.168.0.107:8080/fetchMessages", true);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == XMLHttpRequest.DONE) {
				var response = JSON.parse(xhr.responseText);
				console.log(response);
				console.log(response[0].content);
				response.forEach((item) => {
					createNewMessage(item.sender, item.content);
				  //console.log('Content: ' + item.content);
				});
			}
		}

		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.setRequestHeader('Access-Control-Allow-Origin', 'http://localhost:8080');
		xhr.setRequestHeader('Access-Control-Allow-Credentials', 'true');
		xhr.send(JSON.stringify({
		    topic: globalTopic
		}));
}


function onError(error) {
    connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
    connectingElement.style.color = 'red';
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if(messageContent && stompClient) {
        var chatMessage = {
            sender: username,
            content: messageInput.value,
            type: 'CHAT'
        };
        stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';
    }
    event.preventDefault();
}

function createNewMessage(sender, message){
	var messageElement = document.createElement('li');
	messageElement.classList.add('event-message');
        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode("Old");
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(sender);

        messageElement.appendChild(avatarElement);
 
        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(" " + sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
  

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message);

    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;

}


function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

    if(message.type === 'JOIN') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' joined!';
    } else if (message.type === 'LEAVE') {
        messageElement.classList.add('event-message');
        message.content = message.sender + ' left!';
    } else {
        messageElement.classList.add('chat-message');

        //save to database with other messages
        // content -> message.content
        // sender -> message.sender
        // timestamp -> current/timestamp created
        // topic -> default


		var xhr = new XMLHttpRequest();
		xhr.open("POST", "http://192.168.0.107:8080/saveMessage", true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.send(JSON.stringify({
		    content: message.content,
		    sender: message.sender,
		    topic: globalTopic
		}));


        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        messageElement.appendChild(avatarElement);

        var usernameElement = document.createElement('span');
        var usernameText = document.createTextNode(message.sender);
        usernameElement.appendChild(usernameText);
        messageElement.appendChild(usernameElement);
    }

    var textElement = document.createElement('p');
    var messageText = document.createTextNode(message.content);

    textElement.appendChild(messageText);

    messageElement.appendChild(textElement);

    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;
}


function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true)
messageForm.addEventListener('submit', sendMessage, true)