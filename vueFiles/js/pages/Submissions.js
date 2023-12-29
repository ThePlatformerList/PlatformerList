import { fetchList } from "../content.js";
import { getThumbnailFromId, getYoutubeIdFromUrl, embed } from "../util.js";

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
        <div v-if="message">
            <h3 style="text-align: center;" v-if="message" style="width: min(1000px, 100%)">{{ message }}</h3>
            <br><br>
        </div>
        <h2 style="text-align: center;" v-if="submissions && !submissions.length">No submissions currently.</h2>
        <div style="display: flex; gap: 30px;" id="submissions-content">
        <div style="max-height: 500px; width: 300px; height: 100%; overflow-y: auto; display: flex; flex-direction: column;">
        <div v-for="(submission,i) in submissions" class="surface">
            <div class="surface" style="border: 2px solid; padding: 10px;" @click.native.prevent="setSubmission(i)">
                <h3>Submission #{{i+1}}</h3>
                <br>
                <p>By {{submission.name}}</p>
            </div>
        </div>
        </div>
        <div style="display: flex; gap: 20px; width: min(1000px, 100%);" id="submission-content" v-if="submission">
        <div style="display: block;">
        <a :href="submission.level.video" target="_blank" class="video" v-if="submission.level.video">
            <img :src="getThumbnailFromId(getYoutubeIdFromUrl(submission.level.video))" alt="" width="200">
        </a>
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
            <p style="font-size: 30px;">{{submission.status}}</p>
            <br>
            <p style="font-size: 20px;">Submission by {{ submission.name }}</p>
            <p>Discord ID: {{ submission.discord }}</p>
            <h2>{{ submission.level.position ? '(#' + submission.level.position + ')' : ''}} {{ submission.level.name }} by {{ submission.level.author }}</h2>
            <p>ID: {{ submission.levelID }}</p>
            <p>Time: {{ submission.time }} seconds</p>
            <div class="tabs">
            <button class="tab type-label-lg" :class="{selected: !toggledRaw}" @click="toggledRaw = false">
            <span class="type-label-lg">Video</span>
        </button>
        <button class="tab" :class="{selected: toggledRaw}" @click="toggledRaw = true">
            <span class="type-label-lg">Raw Footage</span>
        </button>
                    </div>
                    <iframe class="video" id="videoframe" :src="video()" frameborder="0" width="300px"></iframe>
                    <p>Comments: {{ submission.comments || "No comments were provided." }}</p>
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
        async submitSubmission(status) {
            this.message = "Sending to server..."
            let req = await fetch("/api/submissions", {
                method: "PATCH",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.submission._id.toString(),
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
        async setSubmissions(archived) {
            if (archived == this.archived) return;
            this.archived = archived
            let req = await fetch(`/api/submissions${archived ? "?archived=true" : ""}`)
            let data = await req.json()
            if (req.ok) {
                this.submissions = data.map(e => {
                    e.level.video = `https://youtu.be/${e.level.ytcode || ""}`
                    return e
                })
                this.submission = undefined
                this.index = 0
            }
        },
        setSubmission(i) {
            this.submission = { ...this.submissions[i] }
            this.index = i
        },
        video() {
            return embed(
                this.toggledRaw ? this.submission.raw : this.submission.link,
            );
        },
    }
};
