$(function () {
  preInit();
  setTimeout(init, 3000);
});

function preInit () {
  $('#video').show();
  $('#snapshot').hide();
  $('.contentBar').hide();
  loadSpinner();
}

function loadSpinner () {
  $('.circle, .circle1').removeClass('stop');
  $('.triggerFull').click(function () {
    $('.circle, .circle1').toggleClass('stop');
  });
}

function init () {
  loadFirstModal();
  loadWebCam();
  postInit();
}

function postInit() {
  $('.setup-box').hide();
}

function reset () {
  init();
}

function loadFirstModal () {
  $('#modal-container').removeAttr('class').addClass('one');
  $('body').addClass('modal-active');
}

function loadFinalSpinner () {
  $('.barlittle').removeClass('stop');
  $('.triggerBar').click(function () {
    $('.barlittle').toggleClass('stop');
  });
}

function loadWebCam () {
  var canvas = document.getElementById('canvas');
  var context = canvas.getContext('2d');
  var video = document.getElementById('video');
  var image = null;
  var faceId = null;

  // Access webcam!
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: true }).then(function (stream) {
      video.src = window.URL.createObjectURL(stream);
      video.play();
    });
  }

  $('#snap').click(function () {
    $('#snap').hide();
    $('#enroll').hide();
    $('.enroll-box').hide()
    var msg = 'Detecting face... hold still...'
    console.log(msg);
    $('.status').html('Looking at you now...');
    context.drawImage(video, 0, 0, 362, 392);
    setTimeout(() => convertCanvasToImage(canvas), 500);
  });
}

// Convert canvas to an image
function convertCanvasToImage (canvas) {
  var image = new Image();

  // Converting base64-encoded JPEG to image blob
  var data = canvas.toDataURL("image/jpeg");
  fetch(data)
    .then(res => res.blob())
    .then(blobData => {
      $('#snap').hide();
      detectFace(blobData)
    })

  $('#snapshot').attr('src', data)
}