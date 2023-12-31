import { fetchList } from "../content.js";
import { getThumbnailFromId, getYoutubeIdFromUrl, embed } from "../util.js";

import Spinner from "../components/Spinner.js";
import Btn from "../components/Btn.js";

export default {
    components: { Spinner, Btn },
    template: `
        <main v-if="!admins">
            <Spinner></Spinner>
        </main>
        <main v-else>
        <div style="width: 100vw">
        <br>
        <div style="display: grid; place-items: center">
        <div style="width: fit-content; border-radius: 20px; border: 1px solid; padding: 20px;">
        <p style="font-size: 20px; font-weight: bold;">Add Admin <Btn @click.native.prevent="createAdminDraft()" style="height: inherit; padding: 8px; padding-top: 4px; padding-bottom: 5px">+</Btn></p>
        <br>
        <div v-if="message">
            <h3 v-if="message" style="width: min(1000px, 100%); text-align: center;">{{ message }}</h3>
            <br><br>
        </div>
        <h2 style="text-align: center;" v-if="admins && !admins.length">No admins currently.</h2>
        <div style="display: flex; gap: 30px;" id="submissions-content">
        <div style="max-height: 500px; width: 500px; height: 100%; overflow-y: auto; display: flex; flex-direction: column;">
        <div v-for="(admin,i) in admins" class="surface">
            <div class="surface" style="border: 1px solid; padding: 10px;" @click.native.prevent="setAdmin(i)">
                <h3>{{admin.global_name || admin.username}}</h3>
                <br>
                <p>{{ admin.id }}</p>
                <br>
                <p v-if="admin?.draft">Draft</p>
            </div>
        </div>
        </div>
        <div style="display: flex; gap: 20px; width: min(1000px, 100%);" id="submission-content" v-if="admin">
        <div style="display: block;">
        <div v-if="admin.id">
        <img :src="admin.banner" style="width: 100%" v-if="admin.banner"/>
        <div :style="'width: 100%; height: 137px; background-color: ' + admin.banner_color" v-else-if="admin.banner_color"></div>
        <br>
            <h2><img :src="admin.avatar" style="display: inline; height: 40px; border-radius: 30px; position: relative; top: 9px"/> {{admin.global_name || admin.username}}</h2>
            <br>
            <p v-if="admin.global_name">{{admin.username}}</p>
        <br><br>
        </div>
        <div v-if="admin.draft">
            <textarea v-model="admin.id" class="inputs" @input.native.prevent="reloadAdmin"/>
            <br><br>
            <Btn @click.native.prevent="addAdmin()" v-if="admin.username">Add</Btn>
            <br><br>
            <Btn style="background-color: #e91e63;" @click.native.prevent="deleteAdminDraft()" v-else>Delete Draft</Btn>
        </div>
            <Btn style="background-color: #e91e63;" @click.native.prevent="deleteAdmin()" v-else>Delete</Btn>
        </div>
    </div>
</div>
</div>
</div>
    </div>
        </main>
    `,
    data: () => ({
        admins: undefined,
        admin: undefined,
        index: 0,
        message: ""
    }),
    async mounted() {
        let req = await fetch("/api/admins")
        let data = await req.json()
        if (req.ok) {
            this.admins = data.map(e => {
                e.username = e.global_name ? e.username : `${e.username}#${e.discriminator}`
                e.banner = e.banner ? `https://cdn.discordapp.com/banners/${e.id}/${e.banner}.${e.banner.startsWith("a_") ? "gif" : "png"}` : null
                e.avatar = e.avatar ? `https://cdn.discordapp.com/avatars/${e.id}/${e.avatar}.${e.avatar.startsWith("a_") ? "gif" : "png"}` : parseInt(e.discriminator) ? `https://cdn.discordapp.com/embed/avatars/${(parseInt(e.id) >> 22) % 6}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(e.discriminator) % 5}.png`
                return e
            })
        }
    },
    computed: {

    },
    methods: {
        setAdmin(i) {
            this.admin = { ...this.admins[i] }
            this.index = i
        },
        createAdminDraft() {
            this.admins.splice(0, 0, {draft: true})
            this.index = 0
            this.admin = { ... this.admins[0] }
        },
        async deleteAdminDraft() {
            let confirm = await Swal.fire({
                title: "Confirm?",
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Continue',
                denyButtonText: 'Cancel',
                html: `
                    <div style="overflow: hidden">
                    <h3 style="text-align: center">Delete admin draft ${this.admin.username ? `${this.admin.global_name || this.admin.username} (${this.admin.id})` : ""}</h3>
                    <br>
                    </div>
                `
            })
        if(confirm.isDenied) return;
            this.admins.splice(this.index, 1)
            this.index = 0
            this.admin = undefined
        },
        async addAdmin() {
            let confirm = await Swal.fire({
                title: "Confirm?",
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Continue',
                denyButtonText: 'Cancel',
                html: `
                    <div style="overflow: hidden">
                    <h3 style="text-align: center">Add admin ${this.admin.global_name || this.admin.username} (${this.admin.id})</h3>
                    <br>
                    </div>
                `
            })
        if(confirm.isDenied) return;
            this.message = "Sending to server..."
            let req = await fetch("/api/admins", {
                method: "POST",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.admin.id
                })
            })
            if (req.ok) {
                this.message = "Fetching new information..."
                let req = await fetch("/api/admins")
                let data = await req.json()
                if (req.ok) {
                    this.admins = data.map(e => {
                        e.username = e.global_name ? e.username : `${e.username}#${e.discriminator}`
                        e.banner = e.banner ? `https://cdn.discordapp.com/banners/${e.id}/${e.banner}.${e.banner.startsWith("a_") ? "gif" : "png"}` : null
                        e.avatar = e.avatar ? `https://cdn.discordapp.com/avatars/${e.id}/${e.avatar}.${e.avatar.startsWith("a_") ? "gif" : "png"}` : parseInt(e.discriminator) ? `https://cdn.discordapp.com/embed/avatars/${(parseInt(e.id) >> 22) % 6}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(e.discriminator) % 5}.png`
                        return e
                    })
                    this.message = `Successfully added admin.`
                    this.index = this.admins.findIndex(e => e.id== this.admin.id)
                    this.admin = { ...this.admins[this.index] }
                    setTimeout(() => {
                        this.message = ""
                    }, 3000)
                }
            } else {
                let data = await req.json()
                this.message = data.message
            }
        },
        async deleteAdmin() {
            let confirm = await Swal.fire({
                title: "Confirm?",
                showDenyButton: true,
                showCancelButton: false,
                confirmButtonText: 'Continue',
                denyButtonText: 'Cancel',
                html: `
                    <div style="overflow: hidden">
                    <h3 style="text-align: center">Delete admin ${this.admin.global_name || this.admin.username} (${this.admin.id})</h3>
                    <br>
                    </div>
                `
            })
        if(confirm.isDenied) return;
            this.message = "Sending to server..."
            let req = await fetch("/api/admins", {
                method: "DELETE",
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify({
                    id: this.admin.id
                })
            })
            if (req.ok) {
                this.message = "Fetching new information..."
                let req = await fetch("/api/admins")
                let data = await req.json()
                if (req.ok) {
                    this.admins = data.map(e => {
                        e.username = e.global_name ? e.username : `${e.username}#${e.discriminator}`
                        e.banner = e.banner ? `https://cdn.discordapp.com/banners/${e.id}/${e.banner}.${e.banner.startsWith("a_") ? "gif" : "png"}` : null
                        e.avatar = e.avatar ? `https://cdn.discordapp.com/avatars/${e.id}/${e.avatar}.${e.avatar.startsWith("a_") ? "gif" : "png"}` : parseInt(e.discriminator) ? `https://cdn.discordapp.com/embed/avatars/${(parseInt(e.id) >> 22) % 6}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(e.discriminator) % 5}.png`
                        return e
                    })
                    this.message = `Successfully deleted admin.`
                    this.index = 0
                    this.admin = undefined
                    setTimeout(() => {
                        this.message = ""
                    }, 3000)
                }
            } else {
                let data = await req.json()
                this.message = data.message
            }
        },
        async reloadAdmin({target}) {
            let req = await fetch(`/api/user/${target.value}`)
            let e = await req.json()
            if (req.ok) {
                e.username = e.global_name ? e.username : `${e.username}#${e.discriminator}`
                e.banner = e.banner ? `https://cdn.discordapp.com/banners/${e.id}/${e.banner}.${e.banner.startsWith("a_") ? "gif" : "png"}` : null
                e.avatar = e.avatar ? `https://cdn.discordapp.com/avatars/${e.id}/${e.avatar}.${e.avatar.startsWith("a_") ? "gif" : "png"}` : parseInt(e.discriminator) ? `https://cdn.discordapp.com/embed/avatars/${(parseInt(e.id) >> 22) % 6}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(e.discriminator) % 5}.png`
                console.log(e)
                this.admins[this.index] = {...e, draft: true}
                this.admin = {...e, draft: true}
            } else {
                this.admin = {}
            }
        }
    }
};
