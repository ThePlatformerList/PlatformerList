import { fetchList } from "../content.js";
import { getThumbnailFromId, getYoutubeIdFromUrl, shuffle } from "../util.js";

import Spinner from "../components/Spinner.js";
import Btn from "../components/Btn.js";

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="!user">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-roulette">
            <div class="surface" style="display: grid; place-items: center; width: 100vw">

                <div style="width: min(450px, 100%); box-shadow: 10px; padding: 40px; border: 1px solid; border-radius: 20px;">
                <h1 style="text-align: center;">Logged in as:</h1>
                <br>
                    <img :src="user.banner" style="width: 100%" v-if="user.banner"/>
                    <div :style="'width: 100%; height: 306px; background-color: ' + user.banner_color" v-else-if="user.banner_color"></div>
                    <br>
                        <h2><img :src="user.avatar" style="display: inline; height: 40px; border-radius: 30px; position: relative; top: 9px"/> {{user.global_name || user.username}}</h2>
                        <br>
                        <p v-if="user.global_name">{{user.username}}</p>
                    <br><br>
                    <div class="surface" style="display: grid; place-items: center;">
                        <Btn @click.native.prevent="logOut">Log Out</Btn>
                    </div>
                    <br>
                    <div class="surface" style="display: grid; place-items: center;">
                        <Btn @click.native.prevent="mySubmissions">View my Submissions</Btn>
                    </div>
                    <br>
                    <div class="surface" style="display: grid; place-items: center;" v-if="admin">
                        <Btn @click.native.prevent="adminPanel">Admin Page</Btn>
                    </div>
                </div>
            </div>
        </main>
    `,
    data: () => ({
        user: undefined,
        admin: false
    }),
    async mounted() {
        let user = await fetch("/authorize/@me")
        let data = await user.json()
        if(user.ok) {
            let ping = await fetch("/api/admin")
            this.admin = ping.ok
            this.user = data
            this.user.username = data.global_name ? data.username : `${data.username}#${data.discriminator}`
            this.user.banner = data.banner ? `https://cdn.discordapp.com/banners/${data.id}/${data.banner}.${data.banner.startsWith("a_") ? "gif" : "png"}` : null
            this.user.avatar = data.avatar ? `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.${data.avatar.startsWith("a_") ? "gif" : "png"}` : parseInt(data.discriminator) ? `https://cdn.discordapp.com/embed/avatars/${(parseInt(data.id) >> 22) % 6}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(data.discriminator) % 5}.png`
        }
    },
    methods: {
        logOut() {
            window.location.href = "/authorize/revoke"
        },
        mySubmissions() {
            window.location.href = "/#/submissions/@me"
        },
        adminPanel() {
            window.location.href = "/#/adminpanel"
        }
    },
};
