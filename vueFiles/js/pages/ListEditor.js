import { fetchList } from "../content.js";
import { getThumbnailFromId, getYoutubeIdFromUrl, embed, timeToSeconds, secondsToTime } from "../util.js";

import Spinner from "../components/Spinner.js";
import Btn from "../components/Btn.js";

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="!levels">
            <Spinner></Spinner>
        </main>
        <main v-else>
        <div style="width: 100vw">
        <br>
        <div style="display: grid; place-items: center">
        <div style="display: grid; place-items: center;">
        <div style="width: fit-content; border-radius: 20px; border: 1px solid; padding: 20px;">
        <p style="font-size: 20px; font-weight: bold;">Add Level <Btn @click.native.prevent="createLevelDraft()" style="height: inherit; padding: 8px; padding-top: 4px; padding-bottom: 5px">+</Btn></p>
        <br>
        <div v-if="message">
            <h3 v-if="message" style="width: min(1000px, 100%); text-align: center;">{{ message }}</h3>
            <br><br>
        </div>
        <h2 style="text-align: center;" v-if="levels && !levels.length">No levels currently.</h2>
        <div style="display: flex; gap: 30px;" id="submissions-content">
        <div style="max-height: 500px; width: 300px; height: 100%; overflow-y: auto; display: flex; flex-direction: column;">
        <div v-for="(lev,i) in levels" class="surface">
            <div class="surface" style="border: 1px solid; padding: 10px;" @click.native.prevent="setLevel(i)">
                <h3>#{{ i + 1 }}: {{lev.name}}</h3>
                <br>
                <p>By {{lev.author}}</p>
                <br>
                <p v-if="lev?.draft">Draft</p>
            </div>
        </div>
        </div>
        <div style="display: flex; gap: 20px; width: min(1000px, 100%);" id="submission-content" v-if="level">
        <div style="display: block;">
        <a :href="'https://youtu.be/' + level.verification" target="_blank" class="video">
            <img :src="getThumbnailFromId(getYoutubeIdFromUrl('https://youtu.be/' + level.verification))" alt="" width="200">
        </a>
        <br>
                <div v-if="!level?.draft">
                <Btn @click.native.prevent="submitLevel()">Submit</Btn>
                <br>
                <br>
                <Btn style="background-color: #e91e63;" @click.native.prevent="deleteLevel()">Delete</Btn>
                </div>
                <div v-else>
                    <Btn @click.native.prevent="addLevel()">Add</Btn>
                    <br>
                <br>
                <Btn style="background-color: #e91e63;" @click.native.prevent="deleteDraft()">Delete Draft</Btn>
                </div>
        </div>
        <div style="display: grid; gap: 20px;">
            <input v-model="level.name" class="inputs" style="font-size: 30px"/>
            <p style="font-size: 30px;">Position: <input v-model="level.position" type="number" class="inputs" @input.native.prevent="sortLevels(level)" /></p>
            <p style="font-size: 20px; margin-top: 10px;">Author: <input v-model="level.author" class="inputs"/></p>
            <p style="font-size: 20px;">Level ID: <input v-model="level.levelID" class="inputs"/></p>
            <p style="font-size: 20px;">Password: <input v-model="level.password" class="inputs"/></p>
            <p style="font-size: 20px;">Creators: <textarea :value="level.creatorText" @input.native.prevent="updateCreators" class="inputs"/></p>
            <p style="font-size: 20px;">Verifier: <input v-model="level.verifier" class="inputs"/></p>
            <p style="font-size: 20px;">Verifier Time: <input :value="level.verifierTimeText" class="inputs" placeholder="hh:mm:ss.SSS" @input="convertTime" /></p>
            <div class="tabs">
            <button class="tab type-label-lg" :class="{selected: !toggleVerification}" @click="toggleVerification = false">
            <span class="type-label-lg">Showcase</span>
        </button>
        <button class="tab" :class="{selected: toggleVerification}" @click="toggleVerification = true">
            <span class="type-label-lg">Verification</span>
        </button>
                    </div>
                    <iframe class="video" id="videoframe" :src="video()" frameborder="0" width="300px"></iframe>
                    <p v-if="this.toggleVerification">Verification: <input :defaultValue='level.verification' v-model="level.verification" class="inputs"/></p>
                    <p v-else>Showcase: <input :defaultValue='level.ytcode' v-model="level.ytcode" class="inputs"/></p>
                    <p v-if="!level?.draft" style="font-size: 20px; font-weight: bold;">Records: <Btn @click.native.prevent="addRecord()" style="height: inherit; padding: 8px; padding-top: 4px; padding-bottom: 5px">+</Btn></p>
                    <div style="height: 400px; overflow-y: auto; border: 1px solid; border-radius: 20px; padding: 20px;" id="records" v-if="!level?.draft">
                        <div v-for="(record, i) of level.records">
                        <br>
                            <h5 style="text-decoration: underline; text-align: center;">Record by {{record.name}} <Btn @click.native.prevent="deleteRecord(i)" style="background-color: #e91e63; padding: 8px; padding-top: 2px; padding-bottom: 5px">-</Btn></h5>
                            <br>
                            <p>Name: <input :defaultValue='record.name' v-model="record.name" class="inputs"/></p>
                            <br>
                            <p>Link: <textarea :defaultValue='record.link' v-model="record.link" class="inputs"/></p>
                            <br>
                            <iframe class="video" id="videoframe" :src="recordVideo(record.link)" frameborder="0" width="300px"></iframe>
                            <br>
                            <br>
                            <p>Time: <input :value='record.timeText' placeholder="hh:mm:ss.SSS" @input.native.prevent="({target}) => convertRecordTime(i, target.value)" class="inputs"/></p>
                            <br><br>
                            <p>Date: <textarea :value="record.dateText" placeholder="mm/dd/yyyy HH:mm:ss.SSS" class="inputs" @input.native.prevent="({target}) => convertDateToUnix(i, target.value)"/></p>
                        </div>
                        <br>
                    </div>
        </div>
        </div>
        </div>
        </div>
    </div>
    </div>
    </div>
        </main>
    `,
    data: () => ({
        levels: undefined,
        level: undefined,
        message: "",
        toggleVerification: false
    }),
    async mounted() {
        let ping = await fetch("/api/admin")
        if(!ping.ok) return;
        let req = await fetch("/api/levels")
        let data = await req.json()
        if (req.ok) {
            this.levels = data
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
        convertUnixToDate(i) {
            let date = dayjs(this.level.records[i].date).format("MM/DD/YYYY HH:mm:ss.SSS")
            return date
        },
        convertDateToUnix(i, value) {
            let date = dayjs(value, "MM/DD/YYYY HH:mm:ss.SSS").$d.getTime()
            this.level.records[i].date = date
            this.level.records[i].dateText = value
        },
        convertTime({target}) {
            this.level.verifierTimeText = target.value
            this.level.verifierTime = this.timeToSeconds(target.value)
        },
        convertRecordTime(i, value) {
            this.level.records[i].time = this.timeToSeconds(value)
            this.level.records[i].timeText = value
        },
        updateCreators(element) {
            this.level.creatorText = element.target.value
            this.level.creator = element.target.value.split(", ")
        },
        sortLevels(lev) {
            if(!lev.draft) {
                this.levels.splice(this.levels.length, 0, this.levels.find(e => e._id == lev._id))
                this.levels.splice(this.levels.findIndex(e => e._id == lev._id), 1)
            }
            this.levels.sort((a,b) => a.position - b.position)
        },
        addRecord() {
            this.level.records.push({
                name: "",
                link: "",
                time: 0,
                date: Date.now(),
                timeText: "",
                dateText: ""
            })
            setTimeout(() => {
                this.level.records.at(-1).dateText = this.convertUnixToDate(this.level.records.length - 1)
                document.getElementById("records").scrollTop = document.getElementById("records").scrollHeight - 500
            }, 0)
        },
        async deleteDraft() {
            let confirm = await Swal.fire({
                title: "Confirm?",
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Continue',
                denyButtonText: 'Cancel',
                html: `
                    <div style="overflow: hidden">
                    <h3 style="text-align: center">Draft for level ${this.level.name} by ${this.level.author} (${this.level.levelID})</h3>
                    <br>
                    </div>
                `
            })
        if(confirm.isDenied) return;
            this.levels.splice(0, 1)
            this.level = undefined
        },
        createLevelDraft() {
            this.levels.splice(0, 0, {
                draft: true,
                "_id": Math.random(),
                "position": 1,
                "name": "",
                "ytcode": "",
                "video": "https://youtu.be",
                "creator": [],
                "levelID": "",
                "verifier": "",
                "records": [],
                "__v": 0,
                "password": "",
                "author": "",
                "verification": ""
            })
            this.level = this.levels[0]
        },
        deleteRecord(i) {
            this.level.records.splice(i, 1)
        },
        async addLevel() {
            let confirm = await Swal.fire({
                title: "Confirm?",
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Continue',
                denyButtonText: 'Cancel',
                html: `
                    <div style="overflow: hidden">
                    <h3 style="text-align: center">Add level ${this.level.name} by ${this.level.author} (${this.level.levelID})</h3>
                    <br>
                    <p style="text-align: center">Please check all the information before submitting!</p>
                    <br>
                    </div>
                `
            })
        if(confirm.isDenied) return;
            this.message = "Sending to server..."
            let req = await fetch("/api/levels", {
                method: "POST",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(this.level)
            })
            if (req.ok) {
                this.message = "Fetching new information..."
                let req = await fetch("/api/levels")
                let data = await req.json()
                if (req.ok) {
                    this.levels = data
                    this.message = `Successfully added level.`
                    this.setLevel(this.levels.findIndex(e => e.levelID.toString() == this.level.levelID.toString()))
                    setTimeout(() => {
                        this.message = ""
                    }, 3000)
                }
            } else {
                let data = await req.json()
                this.message = data.message
            }
        },
        async deleteLevel() {
            let confirm = await Swal.fire({
                title: "Confirm?",
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Continue',
                denyButtonText: 'Cancel',
                html: `
                    <div style="overflow: hidden">
                    <h3 style="text-align: center">Delete level ${this.level.name} by ${this.level.author} (${this.level.levelID})</h3>
                    <br>
                    </div>
                `
            })
        if(confirm.isDenied) return;
            this.message = "Sending to server..."
            let req = await fetch("/api/levels", {
                method: "DELETE",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.level._id.toString()
                })
            })
            if (req.ok) {
                this.message = "Fetching new information..."
                let req = await fetch("/api/levels")
                let data = await req.json()
                if (req.ok) {
                    this.levels = data
                    this.level = undefined
                    this.message = `Successfully deleted level.`
                    setTimeout(() => {
                        this.message = ""
                    }, 3000)
                }
            } else {
                let data = await req.json()
                this.message = data.message
            }
        },
        async submitLevel() {
            let confirm = await Swal.fire({
                title: "Confirm?",
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Continue',
                denyButtonText: 'Cancel',
                html: `
                    <div style="overflow: hidden">
                    <h3 style="text-align: center">Edit level ${this.level.name} by ${this.level.author} (${this.level.levelID})</h3>
                    <br>
                    <p style="text-align: center">Please check all the information before submitting!</p>
                    <br>
                    </div>
                `
            })
        if(confirm.isDenied) return;
            this.message = "Sending to server..."
            let req = await fetch("/api/levels", {
                method: "PATCH",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.level._id.toString(),
                   update: this.level
                })
            })
            if (req.ok) {
                this.message = "Fetching new information..."
                let req = await fetch("/api/levels")
                let data = await req.json()
                if (req.ok) {
                    this.levels = data
                    this.message = `Successfully updated level.`
                    this.setLevel(this.levels.findIndex(e => e._id.toString() == this.level._id.toString()))

                    setTimeout(() => {
                        this.message = ""
                    }, 3000)
                }
            } else {
                let data = await req.json()
                this.message = data.message
            }
        },
        setLevel(i) {
            this.level = this.levels[i]
            this.level.creatorText = this.level.creator.join(', ')
            this.level.verifierTimeText = this.level.verifierTime ? secondsToTime(this.level.verifierTime) : ''
            this.level.records = this.level.records.map((e,i) => {
                return {
                    ...e,
                    timeText: this.secondsToTime(e.time),
                    dateText: this.convertUnixToDate(i)
                }
            })
        },
        recordVideo(link) {
            return embed(
                link
            );
        },
        video() {
            return embed(
                `https://youtu.be/${this.toggleVerification ? this.level.verification : this.level.ytcode}`
            );
        },
    }
};
