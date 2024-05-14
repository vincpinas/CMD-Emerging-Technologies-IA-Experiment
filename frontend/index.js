const base_url = "http://localhost:3000"

let options_from_backend,
    selected_speaker,
    selected_subreddit,
    recording = false,
    chunks = [],
    blob = null;

await fetch(`${base_url}/info`).then(res => res.json()).then(data => options_from_backend = data)

const available_speakers = options_from_backend.speakers;
const available_subreddits = options_from_backend.subreddits;

const remove_class = (name) => {
    if (!document.querySelector(name)) return;

    let item = document.querySelector(name);
    item.classList.remove(name.replace(".", ""))
}


const speakers_title = document.createElement("h2")
speakers_title.innerHTML = "Available Speakers"
const speakers_list = document.createElement("ul")

for (let i = 0; i < available_speakers.length; i++) {
    const element = available_speakers[i];
    const li = document.createElement("li")
    const button = document.createElement("button")
    button.setAttribute("data-speaker", element)

    button.addEventListener("click", () => {
        selected_speaker = button.dataset.speaker;
        remove_class(".selected-speaker")
        button.classList.add("selected-speaker")
    })

    button.innerHTML = element.replace("_", " ").replace(".mp3", "");
    li.appendChild(button);

    speakers_list.appendChild(li)
}

document.body.appendChild(speakers_title)
document.body.appendChild(speakers_list)




const record_title = document.createElement("h4")
record_title.innerHTML = "Record your own voice"
const record_container = document.createElement("section")
record_container.className = "record"
const record_button = document.createElement("button")
record_button.innerHTML = `<i class="fa-solid fa-microphone"></i>`
const clip_container = document.createElement("article")
clip_container.className = "clip"
const audio = document.createElement("audio");
clip_container.appendChild(audio)

if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    console.log("getUserMedia supported.");
    navigator.mediaDevices
        .getUserMedia(
            // constraints - only audio needed for this app
            {
                audio: true,
            },
        )

        // Success callback
        .then((stream) => {
            const mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            record_button.addEventListener("click", () => {
                if (recording) {
                    recording = false;
                    mediaRecorder.stop();
                    console.log(mediaRecorder.state);
                    record_button.style.background = "";
                    record_button.style.color = "";
                    record_button.style.border = "";
                    record_button.innerHTML = `<i class="fa-solid fa-microphone"></i>`
                } else {
                    recording = true;
                    mediaRecorder.start();
                    console.log(mediaRecorder.state);
                    record_button.style.background = "red";
                    record_button.style.color = "white";
                    record_button.style.border = "2px solid #e90000";
                    record_button.innerHTML = `<i class="fa-solid fa-microphone-slash"></i>`
                }
            })

            mediaRecorder.addEventListener("stop", () => {
                audio.setAttribute("controls", "");
                blob = new Blob(chunks, { type: "audio/wav; codecs=opus" })
                chunks = [];
                const audioURL = window.URL.createObjectURL(blob);
                audio.src = audioURL;
            })
        })

        // Error callback
        .catch((err) => {
            console.error(`The following getUserMedia error occurred: ${err}`);
        });
} else {
    console.log("getUserMedia not supported on your browser!");
}

const recording_label = document.createElement("label")
recording_label.innerHTML = "use own recording"
const recording_checkbox = document.createElement("input")
recording_checkbox.type = "checkbox"
recording_label.appendChild(recording_checkbox)


document.body.appendChild(record_title)
record_container.appendChild(record_button)
record_container.appendChild(clip_container)
document.body.appendChild(record_container)
document.body.appendChild(recording_label)
document.body.appendChild(document.createElement("hr"))


const subreddits_title = document.createElement("h2")
subreddits_title.innerHTML = "Pick a subreddit"
const subreddits_list = document.createElement("ul")

for (let i = 0; i < available_subreddits.length; i++) {
    const element = available_subreddits[i];
    const li = document.createElement("li")
    const button = document.createElement("button")
    button.setAttribute("data-subreddit", element)

    button.addEventListener("click", () => {
        selected_subreddit = button.dataset.subreddit;
        remove_class(".selected-subreddit")
        button.classList.add("selected-subreddit")
    })

    button.innerHTML = element.replace("_", " ").replace(".mp3", "");
    li.appendChild(button);

    subreddits_list.appendChild(li)
}

document.body.appendChild(subreddits_title)
document.body.appendChild(subreddits_list)

speakers_list.firstChild.firstChild.click()
subreddits_list.firstChild.firstChild.click()

const submit = document.createElement("button")
submit.className = "submit"
submit.innerHTML = "Submit"

submit.addEventListener("click", async (e) => {
    e.preventDefault()

    const data = (() => {
        const temp_file_name = `temp-${Date.now()}`
        const formData = new FormData();

        formData.append("speaker", recording_checkbox.checked ? temp_file_name + ".wav" : selected_speaker)
        formData.append("subreddit", selected_subreddit)
        formData.append("audio_blob", new File([blob], temp_file_name))
        formData.append("use_own_audio", recording_checkbox.checked)

        return formData;
    })()

    await fetch(`${base_url}/script`, {
        method: "POST",
        body: data
    })
        .then(res => res.json())
        .then(data => console.log(data))
})

document.body.appendChild(submit)

setInterval(async () => {
    let busy;

    await fetch(`${base_url}/busy`)
        .then(res => res.json())
        .then(data => busy = data)

    if (busy) {
        submit.disabled = true;
    } else {
        submit.disabled = false;
    }
}, 500)
