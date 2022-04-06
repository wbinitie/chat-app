const socket = io();
// Elements
const $messageForm = document.querySelector("form");
const $messageFormInput = $messageForm.querySelector("#message");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $sendMessage = document.querySelector("#messages");
const $sendLocation = document.querySelector("#location");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
console.log(username);

const autoScroll = () => {
  //New message element
  const $newMessage = $sendMessage.lastElementChild;

  // Height of the new message
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  //Visible Height
  const visibleHeight = $sendMessage.offsetHeight;

  //Height of the messages container
  const containerHeight = $sendMessage.scrollHeight;

  //How far have I scrolled
  const scrollOffset = $sendMessage.scrollTop + visibleHeight;

  if (
    Math.round(containerHeight - newMessageHeight - 1) <=
    Math.round(scrollOffset)
  ) {
    $sendMessage.scrollTop = $sendMessage.scrollHeight;
  }
};

socket.on("message", (message) => {
  const html = Mustache.render(messageTemplate, {
    user: message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("LT"),
  });
  $sendMessage.insertAdjacentHTML("beforeend", html);
  autoScroll();
});

socket.on("roomData", ({ room, users }) => {
  const html = Mustache.render(sidebarTemplate, {
    room,
    users,
  });

  document.querySelector("#sidebar").innerHTML = html;
});

socket.on("locationMessage", (url) => {
  if (url !== undefined) {
    console.log(url);

    const locationMessage = "My Current Location";
    const location = Mustache.render(locationTemplate, {
      user: url.username,
      url: url.text,
      createdAt: moment(url.createdAt).format("LT"),
      locationMessage,
    });
    $sendMessage.insertAdjacentHTML("beforeend", location);
  }
  autoScroll();
  // const html = Mustache.render(messageTemplate, { message });
  // $sendMessage.insertAdjacentHTML("beforeend", html);
});

$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  // disable
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    // enable
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) return console.log(error);
    console.log("Message Delivered");
  });
});

$sendLocationButton.addEventListener("click", () => {
  $sendLocationButton.setAttribute("disabled", "disabled");
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported on your browser.");
  }

  navigator.geolocation.getCurrentPosition((position) => {
    $sendLocationButton.removeAttribute("disabled");
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        console.log("Location sent");
      }
    );
  });
});

socket.emit("join", { username, room }, (error) => {
  if (error) {
    alert(error);
    location.href = "/";
  }
});
