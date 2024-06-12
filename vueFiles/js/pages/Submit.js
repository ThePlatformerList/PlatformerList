import { fetchList } from "../content.js";
import { getThumbnailFromId, getYoutubeIdFromUrl, shuffle, timeToSeconds } from "../util.js";


import Spinner from "../components/Spinner.js";
import Btn from "../components/Btn.js";

export default {
    components: { Spinner, Btn },
    template: `
    <main v-if="authenticated == undefined">
        <Spinner></Spinner>
    </main>
    <main v-else-if="authenticated == false">
        <div class="surface" style="display: grid; place-items: center; width: 100vw">
            <h2>You must be authenticated in order to submit!</h2>
        </div>
    </main>
        <main class="page-roulette" v-else>
            <div class="surface" style="display: grid; place-items: center; width: 100vw; margin-top: 50px;">
                <div style="width: min(450px, 100%); box-shadow: 10px; padding: 10px;">
                <h1 style="text-align: center;">Submit a record</h1>
                <div v-if="message">
                <br><br>
                <h3 style="text-align: center;" v-if="message">{{ message }}</h3>
                </div>
                <br><br>
                <div style="border: 1px solid; border-radius: 20px; padding: 20px;">
                    <h3>Username</h3>
                    <input v-model="submission.name" class="inputs" style="margin-top: 10px;" placeholder="name..."/>
                    <br><br>
                    <h3>Level ID</h3>
                    <input v-model="submission.levelID" class="inputs" style="margin-top: 10px;" placeholder="level ID..."/>
                    <br><br>
                    <h3>Link</h3>
                    <textarea v-model="submission.link" class="inputs" style="margin-top: 10px;" placeholder="link..."/>
                    <br><br>
                    <h3>Raw Footage</h3>
                    <textarea v-model="submission.raw" class="inputs" style="margin-top: 10px;" placeholder="raw footage..."/>
                    <br><br>
                    <h3>Time</h3>
                    <input class="inputs" :value="submission.timeText" style="margin-top: 10px; width: 260px;" placeholder="hh:mm:ss.SSS / mm:ss.SSS / ss.SSS" @input.native.prevent="convertTime"/>
                    <table style="width: 260px;  font-family: 'Lexend Deca', sans-serif; margin-top: 10px;">
                            <tr>
                                <th>Hours</th>
                                <th>Minutes</th>
                                <th>Seconds</th>
                            </tr>
                            <tr>
                                <td style="text-align: center;">{{ submission.timeText?.split(":")?.reverse()?.[2] || 00 }}</td>
                                <td style="text-align: center;">{{ submission.timeText?.split(":")?.reverse()?.[1] || 00 }}</td>
                                <td style="text-align: center;">{{ submission.timeText?.split(":")?.reverse()?.[0] || 00 }}</td>
                            </tr>
                    </table>
                    <br><br>
                    <h3>Comments?</h3>
                    <br>
                    <p>(Add a placement op if you have one)</p>
                    <textarea v-model="submission.comments" class="inputs" style="margin-top: 10px;" placeholder="comments..."/>
                    <br><br>
                <br>
                <Btn @click.native.prevent="submit" id="submit">Submit</Btn>
                </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        message: "",
        submission: {
            name: "",
            levelID: "",
            link: "",
            raw: "",
            time: "",
            timeText: "",
            comments: ""
        },
        authenticated: undefined
    }),
    async mounted() {
        let user = await fetch("/authorize/@me")
        this.authenticated = user.ok
    },
    methods: {
        timeToSeconds,
        convertTime({target}) {
            this.submission.timeText = target.value
            this.submission.time = this.timeToSeconds(target.value)
        },
        async submit() {
            document.getElementById("submit").disabled = true
            this.message = "Sending to server..."
            let req = await fetch("/api/submissions/@me", {
                method: "POST",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(this.submission)
            })
            if (req.ok) {
                    this.submission = {
                        name: "",
                        levelID: "",
                        link: "",
                        raw: "",
                        time: "",
                        timeText: "",
                        comments: ""
                    } 
                    this.message = `Successfully submitted.`
                    setTimeout(() => {
                        this.message = ""
                        window.location.href = "/#/submissions/@me"
                    }, 3000)
            } else {
                let data = await req.json()
                document.getElementById("submit").disabled = false
                this.message = data.message
            }
        }
    },
};
