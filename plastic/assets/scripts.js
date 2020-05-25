var animateButton = function (e) {
    e.preventDefault;
    e.target.classList.remove('animate');
    e.target.classList.add('animate');
    setTimeout(function () {
        e.target.classList.remove('animate');
    }, 700);
};
var bubblyButtons = document.getElementsByClassName("bubbly-button");
for (var i = 0; i < bubblyButtons.length; i++) {
    bubblyButtons[i].addEventListener('mouseover', animateButton, false);
}

$(function () {
    $.get("/lock", function (data) {
        console.log("close dustbin", data);
    });
    $.get("/reset", function (data) {
        console.log("reset", data);
    });
});

let bottleCnt = 10;
const URL = "./model/";
let model, webcam, labelContainer, maxPredictions;

async function init() {
    const start_button = document.getElementById("start_button");
    const cam = document.getElementById("webcam-container");
    const com = document.getElementById("webcom");
    start_button.style.display = "none";
    cam.style.display = "block";
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    const flip = false;
    webcam = new tmImage.Webcam(400, 400, flip);
    await webcam.setup();
    await webcam.play();
    window.requestAnimationFrame(loop);
    cam.appendChild(webcam.canvas);
}
function open_dustbin() {
    $.get("/unlock", function (data) {
        console.log("open dustbin", data);
    });
}
function close_dustbin() {
    $.get("/lock", function (data) {
        console.log("close dustbin", data);
    });
    ask_question();
}
function dustbin() {
    open_dustbin();
    setTimeout(function () {
        bottleCnt += 1;
        close_dustbin();
    }, 10000);
}
function ask_question() {
    Swal.fire({
        title: 'Do you want to add more bottles?',
        //text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        allowOutsideClick: false,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes!'
    }).then((result) => {
        if (result.value) {
            window.requestAnimationFrame(loop);
        } else {
            ask_phoneNumber();
        }
    });
}
function ask_choices(phno) {
    const inputOptions = new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                'option1': 'COLLECT COUPON',
                'option2': 'MOBILE PAY RECHARGE',
                'option3': "DONATE TO CHILDREN'S EDUCATION",
                'option4': "SAVE"
            })
        }, 1000);

    });
    new Promise((resolve) => {
        $.get(`/fetch/${phno}`, function (data) {
            console.log(data);
            let totalcount=(data.message != 'success') ? 0+bottleCnt : parseInt(data.count.count)+bottleCnt;
            Swal.fire({
                title: 'Select choice',
                input: 'radio',
                text: 'You have added ' + bottleCnt + ((bottleCnt == 1) ? ' bottle.' : ' bottles') + ' now.' + ((data.message != 'success') ? '' : ' You have saved ' + data.count.count + ((data.count.count == 1) ? ' bottle.' : ' bottles') + ' in earlier.'),
                inputOptions: inputOptions,
                allowOutsideClick: false,
                inputValidator: (value) => {
                    if (!value) {
                        return 'You need to choose something!'
                    } else {
                        if (value == 'option4') {
                            $.get(`/save/${phno}/${totalcount}`, function (data) {
                                console.log(data);
                                home();
                            });
                        } else {
                            $.get(`/customer/${phno}/${value}/${totalcount}`, function (data) {
                                console.log(data);
                                home();
                            });
                        }
                    }
                }
            });
        });
    });
}
function ask_phoneNumber() {

    Swal.fire({
        title: 'Submit your Phone Number',
        input: 'number',
        // text: 'You have chosen ' + choice,
        showCancelButton: true,
        confirmButtonText: 'Submit',
        showLoaderOnConfirm: true,
        inputValidator: (value) => {
            if (!value) {
                return 'You need to submit your phone number!'
            } else {
                if (value.toString().length != 10) {
                    return 'Enter valid mobile number!'
                } else {
                    ask_choices(value);
                }
            }
        },
        // preConfirm: (phno) => {
        //     return fetch(`/customer/${phno}/${choice}/${bottleCnt}`).then(response => {
        //         if (!response.ok) {
        //             throw new Error(response.statusText)
        //         }
        //         return response.json()
        //     })
        //         .catch(error => {
        //             Swal.showValidationMessage(
        //                 `Request failed: ${error}`
        //             )
        //         })
        // },
        allowOutsideClick: false
    });
    // .then((result) => {
    //     if (result.value) {
    //         let resp = result.value;
    //         console.log(resp);
    //         home();
    //     }
    // });
}
function consle(data) {
    let link = "/console/" + data;
    $.get(link, function (data) {
    });
}
function home() {
    Swal.fire(
        'Process Done!',
        'success'
    )
    setTimeout(() => {
        // start_button.style.display = "block";
        // com.style.display = "none";
        location.reload();
    }, 5000);
}
async function loop() {
    webcam.update();
    //await predict();
    let label_index = 0;
    const prediction = await model.predict(webcam.canvas);
    if (prediction[label_index].probability.toFixed(2) > 0.7) {
        console.log(prediction[label_index].probability.toFixed(2));
        consle(prediction[label_index].probability.toFixed(2) + ":datafromif1");
        let cnt = 0;
        let repeat = 3;
        for (let index = 0; index < repeat; index++) {
            webcam.update();
            const recheck = await model.predict(webcam.canvas);
            consle(recheck[label_index].probability.toFixed(2) + ":datafromif2");
            if (recheck[label_index].probability.toFixed(2) > 0.8) {
                cnt += 1;
            }
        }
        if (cnt == repeat) {
            console.log("Got it");
            Swal.fire({
                icon: 'success',
                title: 'Sucess!',
                text: 'Water Bottle Detected. Now you can add bottle into box.'
            });
            dustbin();
        } else {
            window.requestAnimationFrame(loop);
        }
    } else {
        window.requestAnimationFrame(loop);
    }
}
// async function predict() {
//     const prediction = await model.predict(webcam.canvas);
//     for (let i = 0; i < maxPredictions; i++) {
//         const classPrediction =
//             prediction[i].className + ": " + prediction[i].probability.toFixed(2);
//         labelContainer.childNodes[i].innerHTML = classPrediction;
//     }

// }
