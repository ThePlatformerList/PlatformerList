import { fetchList } from "../content.js";
import { getThumbnailFromId, getYoutubeIdFromUrl, shuffle } from "../util.js";

import Spinner from "../components/Spinner.js";
import Btn from "../components/Btn.js";

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="loading">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-roulette">
            <div class="surface" style="display: grid; place-items: center; width: 100vw">
                <div style="width: min(450px, 100%); box-shadow: 10px; padding: 40px; border: 1px solid; border-radius: 20px;">
                <h1 style="text-align: center;">Admin Panel</h1>
                <br><br>
                    <div class="surface" style="display: grid; place-items: center;">
                        <Btn @click.native.prevent="allSubmissions">View All Submissions</Btn>
                    </div>
                    <br>
                    <div class="surface" style="display: grid; place-items: center;">
                        <Btn @click.native.prevent="listEditor">List Editor</Btn>
                    </div>
                    <br>
                    <div class="surface" style="display: grid; place-items: center;">
                        <Btn @click.native.prevent="adminEditor">Admin Editor</Btn>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        loading: true
    }),
    async mounted() {
        let admin = await fetch("/api/admin")
        if(!admin.ok) return;
        this.loading = false
    },
    methods: {
        allSubmissions() {
            window.location.href = "/#/submissions"
        },
        listEditor() {
            window.location.href = "/#/editlist"
        },
        adminEditor() {
            window.location.href = "/#/editadmins"
        }
    },
};
