const socket = io();
const statusEl = document.getElementById('status');
const eventsEl = document.getElementById('events');
const emptyEl  = document.getElementById('empty');

socket.on('connect', () => {
  statusEl.textContent = 'Connected (socket id: ' + socket.id + ')';
  statusEl.className = 'connected';
});

socket.on('disconnect', () => {
  statusEl.textContent = 'Disconnected';
  statusEl.className = '';
});

['task:created', 'task:updated', 'task:deleted'].forEach(event => {
  socket.on(event, (data) => {
    if (emptyEl) emptyEl.remove();

    const div = document.createElement('div');
    div.className = 'event ' + event;

    const time = new Date().toLocaleTimeString();

    div.innerHTML =
      '<span class="time">' + time + '</span>' +
      '<span class="name">' + event + '</span>' +
      '<span>' + JSON.stringify(data.task || data) + '</span>';

    eventsEl.prepend(div);
  });
});
