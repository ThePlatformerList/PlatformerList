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
        <h1 style="text-align: center; margin-top: 100px">My Submissions</h1>
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
            <h3 v-if="message" style="text-align: center;">{{ message }}</h3>
            <br><br>
        </div>
        <h2 style="text-align: center;" v-if="submissions && !submissions.length">No submissions currently.</h2>
        <div style="display: flex; gap: 30px;" id="submissions-content">
        <div style="max-height: 500px; width: 300px; height: 100%; overflow-y: auto; display: flex; flex-direction: column;">
        <div v-for="(submission,i) in submissions" class="surface">
            <div class="surface" style="border: 1px solid; padding: 10px;" @click.native.prevent="setSubmission(i)">
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
        <p>Status: {{submission.status}}</p>
        <br>
            <div v-if="submission.status == 'pending'">
                <Btn @click.native.prevent="editSubmission()">Submit</Btn>
                <br>
                <br>
                <Btn @click.native.prevent="deleteSubmission()" style="background-color: #e91e63;">Delete</Btn>
            </div>
        </div>
        <div style="display: grid; gap: 20px;">
            <h1>Submission #{{index+1}}</h1>
            <p style="font-size: 20px;">Submission by <input v-model="submission.name" class="inputs" :disabled="submission.status != 'pending'"/></p>
            <p>Discord ID: {{ submission.discord }}</p>
            <h2>{{ submission.level.position ? '(#' + submission.level.position + ')' : ''}} {{ submission.level.name }} by {{ submission.level.author }}</h2>
            <p>ID: <input v-model="submission.levelID" type="number" class="inputs" :disabled="submission.status != 'pending'"/></p>
            <p>Time: <input v-model="submission.time" type="number" class="inputs" :disabled="submission.status != 'pending'"/> seconds</p>
            <div class="tabs">
            <button class="tab type-label-lg" :class="{selected: !toggledRaw}" @click="toggledRaw = false">
            <span class="type-label-lg">Video</span>
        </button>
        <button class="tab" :class="{selected: toggledRaw}" @click="toggledRaw = true">
            <span class="type-label-lg">Raw Footage</span>
        </button>
                    </div>
                    <iframe class="video" id="videoframe" :src="video()" frameborder="0" width="300px"></iframe>
                    <p v-if="this.toggledRaw">Raw: <textarea :defaultValue='submission.raw' v-model="submission.raw" class="inputs" :disabled="submission.status != 'pending'"/></p>
                    <p v-else>Link: <textarea :defaultValue='submission.link' v-model="submission.link" class="inputs" :disabled="submission.status != 'pending'"/></p>
                    <p>Comments: <textarea v-model="submission.comments" class="inputs" :disabled="submission.status != 'pending'"/></p>
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
        let req = await fetch("/api/submissions/@me")
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
        async deleteSubmission() {
            this.message = "Sending to server..."
            let req = await fetch("/api/submissions/@me", {
                method: "DELETE",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.submission._id.toString()
                })
            })
            if (req.ok) {
                this.message = "Fetching new information..."
                let req = await fetch(`/api/submissions/@me${this.archived ? "?archived=true" : ""}`)
                let data = await req.json()
                if (req.ok) {
                    this.submissions = data.map(e => {
                        e.level.video = `https://youtu.be/${e.level.ytcode || ""}`
                        return e
                    })
                    this.submission = undefined
                    this.index = 0
                    this.message = `Successfully deleted submission.`
                    setTimeout(() => {
                        this.message = ""
                    }, 3000)
                }

            } else {
                let data = await req.json()
                this.message = data.message
            }
        },
        async editSubmission() {
            this.message = "Sending to server..."
            let req = await fetch("/api/submissions/@me", {
                method: "PATCH",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.submission._id.toString(),
                    ...this.submission
                })
            })
            if (req.ok) {
                this.message = "Fetching new information..."
                let req = await fetch(`/api/submissions/@me${this.archived ? "?archived=true" : ""}`)
                let data = await req.json()
                if (req.ok) {
                    this.submissions = data.map(e => {
                        e.level.video = `https://youtu.be/${e.level.ytcode || ""}`
                        return e
                    })
                    this.index = this.submissions.findIndex(e => e._id.toString() == this.submission._id.toString())
                    this.submission = {...this.submissions[this.index]}
                    this.message = `Successfully updated submission.`
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
            this.message = "Loading..."
            this.archived = archived
            let req = await fetch(`/api/submissions/@me${archived ? "?archived=true" : ""}`)
            let data = await req.json()
            if (req.ok) {
                this.submissions = data.map(e => {
                    e.level.video = `https://youtu.be/${e.level.ytcode || ""}`
                    return e
                })
                this.submission = undefined
                this.index = 0
                this.message = ""
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
