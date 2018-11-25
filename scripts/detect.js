/**
 * Face detection subroutine - uses Azure Face API
 * @param {*binary image data} imageBlob 
 */
// Keys
var subscriptionKey = "2fc16d05aa134c07af5b0edd8eb41dda";
var faceListId = 'hackathronerz';
var personGroupId = 'hthronerz';
var personId = '65a27e3c-0139-4a1f-bf44-0432a9a57612';


var uriFaceDetect = "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect";
var timeout = 500;
var fadeOutTime = 2000;
var successUrl = '/success.html'
// Facelist
var uriFaceMatch = "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/findsimilars";
var uriFaceList = `https://westcentralus.api.cognitive.microsoft.com/face/v1.0/facelists/${faceListId}/persistedFaces`;

// Persons
var uriFaceIdentify = "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/identify";
var uriPersonFace = `https://westcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/${personGroupId}/persons/`;
var uriGetPerson = `https://westcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/${personGroupId}/persons/`;
var uriAddPerson = `https://westcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/${personGroupId}/persons`
var uriTrainPersonGroup = `https://westcentralus.api.cognitive.microsoft.com/face/v1.0/persongroups/${personGroupId}/train`
var IMAGE_BLOB, CREATED_USER_NAME;

function detectFace (imageBlob) {
  IMAGE_BLOB = imageBlob;
  var params = {
    "returnFaceId": "true",
    "returnFaceLandmarks": "false",
    "returnFaceAttributes": "age,gender",
  };

  $.ajax({
    url: uriFaceDetect + "?" + $.param(params),
    beforeSend: function (xhrObj) {
      xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },
    type: "POST",
    processData: false,
    data: imageBlob,
  })
    .done(function (data) {
      if (data.length === 0) {
        setTimeout(() => {
          msg = 'No face detected! Try again';
          $('#snap').show();
          console.error(msg);
          $('.status').html(msg)
        }, timeout);
        return;
      }
      var face = data[0];
      var faceAttr = face.faceAttributes;
      console.log('Face detected!');
      msg = `I think you are a ${faceAttr.gender}, ${Math.ceil(faceAttr.age)} years old.`
      console.log(msg);
      $('.status').html('Face detected! Verifying you...');
      msg = 'Cross-referencing face across our face database... hang in there...'
      console.log(msg);
      setTimeout(() => identifyFace(face.faceId, imageBlob), timeout)
      // identifyFace(face.faceId, imageBlob);
      // addFaceToPerson(imageBlob);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      // Display error message.
      var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
      errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
        jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
      console.log(errorString);
    });
};

function identifyFace (faceId, imageBlob) {
  var data = {
    faceIds: [faceId],
    personGroupId
  }
  $.ajax({
    url: uriFaceIdentify,
    beforeSend: function (xhrObj) {
      xhrObj.setRequestHeader("Content-Type", "application/json");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },
    type: "POST",
    data: JSON.stringify(data)
  })
    .done(function (data) {
      console.log('Matched Face data', data);
      if (data && data.length > 0 && data[0].candidates && data[0].candidates.length > 0) {
        msg = 'Face matched!!! Valid user... Loggin in...';
        console.log(msg);
        $('.status').html('Face matched! Logging you in securely...');
        const { personId } = data[0].candidates[0]
        setTimeout(() => getPersonDetails(personId), timeout)
        // getPersonDetails(personId)
        return;
      }
      setTimeout(() => {
        msg = 'No face match detected. Enroll as a new user?';
        console.log(msg);
        $('#enroll').show().click(showEnrollBox);
        $('.status').html(msg);
        $('#snap').text('Try again').show();
        // addFaceToPerson(imageBlob)
      }, timeout);
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      // Display error message.
      var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
      errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
        jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
      console.log(errorString);
    });
}

function showEnrollBox () {
  $('.title').html('Biometric Enrollment')
  $('.media-container').hide()
  $('.status').hide();
  $('#snap').hide()
  $('.enroll-box').show()
  $('#enroll').click(enrollUser);
}

function enrollUser () {
  console.log('enroll user');
  // create person
  createPerson();

  // add face to person
}

function createPerson (name) {
  var name = $('#name').val();
  var email = $('#email').val();
  var userData = JSON.stringify({ email })
  CREATED_USER_NAME = name;
  $.ajax({
    url: uriAddPerson,
    beforeSend: function (xhrObj) {
      xhrObj.setRequestHeader("Content-Type", "application/json");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },
    type: "POST",
    data: JSON.stringify({ name, userData })
  })
    .done(function (data) {
      console.log('Person created', data);
      addFaceToPerson(IMAGE_BLOB, data.personId)
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      // Display error message.
      var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
      errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
        jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
      console.log(errorString);
    });
}

function getPersonDetails (personId) {
  $.ajax({
    url: `${uriGetPerson}${personId}`,
    beforeSend: function (xhrObj) {
      xhrObj.setRequestHeader("Content-Type", "application/json");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },
    type: "GET"
  })
    .done(function (person) {
      const { name, userData } = person
      const message = `Welcome, ${name}!`;
      const contact = (userData) ? JSON.parse(userData) : { phone: '', email: '', u: '', p: '' }
      const { email, phone } = contact
      const details = `<hr />${msg}<br/>Email: ${email}<br />Phone: ${phone}`
      const { u, p } = contact
      sessionStorage.setItem('hack-u', u);
      sessionStorage.setItem('hack-p', p);
      console.log(`${name} | ${email} | ${phone}`);

      $('#snap').hide();
      $('.container').removeClass('bg-logo')
      $('.status').fadeOut(fadeOutTime, () => {
        msg = `<strong>Hello, ${name}!</strong><br />Welcome to Consumer Connect!`;
        // $('.status').html(msg).fadeIn(fadeOutTime, () => welcomeUser(message));
        $('.status').html(msg).fadeIn();
      });
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      // Display error message.
      var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
      errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
        jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
      console.log(errorString);
    });
}

function welcomeUser (message) {
  $('.content-gr').hide();
  $('.contentBar').show();
  $('#modal-container').addClass('out');
  $('body').removeClass('modal-active');

  $('.setup-box').show();
  $('.welcome').html(message).show();
  $('.setup').html('Launching you into the portal...');
  $('#snapshot').show()
  setTimeout(loginSuccess, 5000);
}

function loginSuccess (credsString) {
  let switchlen = $('#switch').length;
  if (switchlen) {
    top.window.location.href = `${successUrl}`;
  }
  window.location.href = successUrl;
}

function addFaceToPerson (imageBlob, personId) {
  imageBlob = imageBlob || IMAGE_BLOB;
  $.ajax({
    url: `${uriPersonFace}${personId}/persistedFaces`,
    beforeSend: function (xhrObj) {
      xhrObj.setRequestHeader("Content-Type", "application/octet-stream");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },
    type: "POST",
    processData: false,
    data: imageBlob
  })
    .done(function (data) {
      console.log('Face added to person', data);
      trainPersonGroup();
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      // Display error message.
      var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
      errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
        jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
      console.log(errorString);
    });
}

function trainPersonGroup () {
  $.ajax({
    url: uriTrainPersonGroup,
    beforeSend: function (xhrObj) {
      xhrObj.setRequestHeader("Content-Type", "application/json");
      xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
    },
    type: "POST"
  })
    .done(function (data) {
      console.log('Person group trained!');
      welcomeCreatedUser();
      
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      // Display error message.
      var errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
      errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ?
        jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
      console.log(errorString);
    });
}

function welcomeCreatedUser (message) {
  var message = `Welcome, ${CREATED_USER_NAME}!`
  $('.content-gr').hide();
  // $('.contentBar').show();
  $('#modal-container').addClass('out');
  $('body').removeClass('modal-active');

  $('.setup-box').show();
  $('.welcome').html(message).show();
  $('.setup').html('Biometric enrollment successful. <br />Launching you into the portal now...');
  $('#snapshot').show();
  setTimeout(loginSuccess, 5000);  
}