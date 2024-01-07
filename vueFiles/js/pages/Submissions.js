import { fetchList } from "../content.js";
import { getThumbnailFromId, getYoutubeIdFromUrl, embed, secondsToTime, timeToSeconds } from "../util.js";

import Spinner from "../components/Spinner.js";
import Btn from "../components/Btn.js";

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="!submissions">
            <Spinner></Spinner>
        </main>
        <main v-else>
        <div style="width: 100vw">
        <h1 style="text-align: center; margin-top: 100px">All Submissions</h1>
        <br>
        <div style="display: grid; place-items: center">
        <div class="tabs">
        <button class="tab type-label-lg" :class="{selected: !archived}" @click="setSubmissions(false)">
        <span class="type-label-lg">Active</span>
    </button>
    <button class="tab" :class="{selected: archived}" @click="setSubmissions(true)">
        <span class="type-label-lg">Archived</span>
    </button>
                </div>
        </div>
        <br>
        <div style="display: grid; place-items: center;">
        <div style="width: fit-content; border-radius: 20px; border: 1px solid; padding: 20px;">
        <div v-if="message">
            <h3 style="text-align: center;" v-if="message" style="width: min(1000px, 100%)">{{ message }}</h3>
            <br><br>
        </div>
        <h2 style="text-align: center;" v-if="submissions && !submissions.length">No submissions currently.</h2>
        <div style="display: flex; gap: 30px;" id="submissions-content">
        <div style="max-height: 500px; width: 300px; height: 100%; overflow-y: auto; display: flex; flex-direction: column;">
        <div v-for="(submission,i) in submissions" class="surface">
            <div class="surface" style="padding: 10px; border: 1px solid;" @click.native.prevent="setSubmission(i)">
                <h3>Submission #{{i+1}}</h3>
                <br>
                <p style="font-size: 19px;">{{submission.level.name}}</p>
                <br>
                <p style="font-size: 13px; margin-top: -10px">By {{submission.name}}</p>
            </div>
        </div>
        </div>
        <div style="display: flex; gap: 20px; width: min(1000px, 100%);" id="submission-content" v-if="submission">
        <div style="display: block;">
        <a :href="submission.level.video" target="_blank" class="video" v-if="submission.level.video">
            <img :src="getThumbnailFromId(getYoutubeIdFromUrl(submission.level.video))" alt="" width="200">
        </a>
        <br>
        <p>Status: {{submission.status}}</p>
        <br>
        <div v-if="submission.status != 'accepted'">
        <Btn @click.native.prevent="submitSubmission('accepted')">Accept</Btn>
        <br>
        <br>
        </div>
        <div v-if="submission.status != 'pending'">
        <Btn @click.native.prevent="submitSubmission('pending')">Pend</Btn>
        <br>
        <br>
        </div>
        <div v-if="submission.status != 'rejected'">
        <Btn @click.native.prevent="submitSubmission('rejected')" style="background-color: #e91e63;">Reject</Btn>
        </div>
        </div>
        <div style="display: grid; gap: 20px;">
            <h1>Submission #{{index+1}}</h1>
            <div style="display: flex; gap: 6px" v-if="submission.status == 'pending'">
            <input type="checkbox" v-model="submission.verification" @input="setSubmissionAdd"/><span style="font-family: 'Lexend Deca', sans-serif;">Verification</span>
            </div>
            <p style="font-size: 20px;">Submission by <input v-model="submission.name" class="inputs"/></p>
            <p>Discord ID: {{ submission.discord }}</p>
            <h2 style="margin-top: 15px;">{{ submission.level.position ? '(#' + submission.level.position + ')' : ''}} {{ submission.level.name }} by {{ submission.level.author }}</h2>
            <p>ID: <input v-model="submission.levelID" type="number" class="inputs"/></p>
            <p>Time: <input :defaultValue="secondsToTime(submission.time)" class="inputs" @input.native.prevent="convertTime" placeholder="hh:mm:ss.SSS"/> seconds</p>
            <div class="tabs" v-if="submission.raw">
            <button class="tab type-label-lg" :class="{selected: !toggledRaw}" @click="toggledRaw = false">
            <span class="type-label-lg">Video</span>
        </button>
        <button class="tab" :class="{selected: toggledRaw}" @click="toggledRaw = true">
            <span class="type-label-lg">Raw Footage</span>
        </button>
                    </div>
                    <iframe class="video" id="videoframe" :src="video()" frameborder="0" width="300px"></iframe>
                    <p v-if="this.toggledRaw">Raw: <textarea :defaultValue='submission.raw' v-model="submission.raw" class="inputs"/></p>
                    <p v-else>Link: <textarea :defaultValue='submission.link' v-model="submission.link" class="inputs"/></p>
                    <p>Comments: <textarea v-model="submission.comments" class="inputs"/></p>
        </div>
        </div>
        </div>
    </div>
    </div>
    </div>
        </main>
    `,
    data: () => ({
        submissions: undefined,
        submission: undefined,
        index: 0,
        message: "",
        toggledRaw: false,
        archived: false
    }),
    async mounted() {
        let req = await fetch("/api/submissions")
        let data = await req.json()
        if (req.ok) {
            this.submissions = data.map(e => {
                e.level.video = `https://youtu.be/${e.level.ytcode || ""}`
                e.verification = false
                return e
            })
        }
    },
    computed: {

    },
    methods: {
        embed,
        getThumbnailFromId,
        getYoutubeIdFromUrl,
        secondsToTime,
        timeToSeconds,
        convertTime({target}) {
            this.submission.time = this.timeToSeconds(target.value)
        },
        async submitSubmission(status) {
               let confirm = await Swal.fire({
                    title: "Confirm?",
                    showDenyButton: true,
                    showCancelButton: false,
                    confirmButtonText: 'Continue',
                    denyButtonText: 'Cancel',
                    html: `
                        <div style="overflow: hidden">
                        <h3 style="text-align: center">Submission for level ${this.submission.level.name} by ${this.submission.level.author} (${this.submission.levelID}) from ${this.submission.name}</h3>
                        <br>
                        <p style="text-align: center">Status: ${this.submission.status} => ${status}</p>
                        <br>
                        </div>
                    `
                })
            if(confirm.isDenied) return;
            this.message = "Sending to server..."
            let req = await fetch("/api/submissions", {
                method: "PATCH",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.submission._id.toString(),
                    ...this.submission,
                    status
                })
            })
            if (req.ok) {
                this.message = "Fetching new information..."
                let req = await fetch(`/api/submissions${this.archived ? "?archived=true" : ""}`)
                let data = await req.json()
                if (req.ok) {
                    this.submissions = data.map(e => {
                        e.level.video = `https://youtu.be/${e.level.ytcode || ""}`
                        e.verification = false
                        return e
                    })
                    this.submission = undefined
                    this.index = 0
                    this.message = `Successfully edited submission status to '${status}'.`
                    setTimeout(() => {
                        this.message = ""
                    }, 3000)
                }

            } else {
                let data = await req.json()
                this.message = data.message
            }
        },
        async setSubmissionAdd({target}) {
            let {checked} = target
            this.submission.verification = checked
        },
        async setSubmissions(archived) {
            if (archived == this.archived) return;
            this.message = "Loading..."
            this.archived = archived
            let req = await fetch(`/api/submissions${archived ? "?archived=true" : ""}`)
            let data = await req.json()
            if (req.ok) {
                this.submissions = data.map(e => {
                    e.level.video = `https://youtu.be/${e.level.ytcode || ""}`
                    e.verification = false
                    return e
                })
                this.submission = undefined
                this.index = 0
                this.message = ""
            }
        },
        setSubmission(i) {
            this.submission = this.submissions[i]
            this.index = i
        },
        video() {
            return embed(
                this.toggledRaw && this.submission.raw ? this.submission.raw : this.submission.link,
            );
        },
    }
};
