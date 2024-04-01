import { store } from '../main.js';
import { embed, getFontColour, secondsToTime } from '../util.js';
import { score } from '../score.js';
import { fetchEditors, fetchList } from '../content.js';

import Spinner from '../components/Spinner.js';
import LevelAuthors from '../components/List/LevelAuthors.js';

const roleIconMap = {
	owner: 'crown',
	admin: 'user-gear',
	seniormod: 'user-shield',
	mod: 'user-lock',
    trial: 'user-check',
	dev: 'code'
};

export default {
	components: { Spinner, LevelAuthors },
	template: `
        <main v-if="loading" class="surface">
            <Spinner></Spinner>
        </main>
        <main v-else class="page-list">
            <div class="list-container surface">
                <table class="list" v-if="list">
                    <tr v-for="([level, err], i) in list">
                        <td class="rank">
                            <p v-if="i + 1 <= 1000" class="type-label-lg">#{{ i + 1 }}</p>
                            <p v-else class="type-label-lg">Legacy</p>
                        </td>
                        <td class="level" :class="{ 'active': selected == i, 'error': !level }">
                            <button @click="selected = i">
                                <span class="type-label-lg">{{ level?.name || \`Error (\${err}.json)\` }}</span>
                            </button>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="level-container surface">
                <div class="level" v-if="level">
                    <h1>{{ level.name }}</h1>
                    <LevelAuthors :author="level.author" :creators="level.creator" :verifier="level.verifier"></LevelAuthors>
                    <div class="packs" v-if="level.packs.length > 0">
                        <div v-for="pack in level.packs" class="tag" :style="{background:pack.colour}">
                            <p :style="{color:getFontColour(pack.colour)}">{{pack.name}}</p>
                        </div>
                    </div>
                    <div v-if="level.ytcode" class="tabs">
                        <button class="tab type-label-lg" :class="{selected: !toggledShowcase}" @click="toggledShowcase = false">
                            <span class="type-label-lg">Verification</span>
                        </button>
                        <button class="tab" :class="{selected: toggledShowcase}" @click="toggledShowcase = true">
                            <span class="type-label-lg">Showcase</span>
                        </button>
                    </div>
                    <iframe class="video" id="videoframe" :src="video" frameborder="0"></iframe>
                    <ul class="stats">
                        <li>
                            <div class="type-title-sm">Base Points</div>
                            <p>{{ score(selected + 1, 100, level.percentToQualify || 100) }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">ID</div>
                            <p>{{ level.levelID }}</p>
                        </li>
                        <li>
                            <div class="type-title-sm">Password</div>
                            <p>{{ level.password || 'Free to Copy' }}</p>
                        </li>
                    </ul>
                    <h2>Records</h2>
                    <p>Verifier's time: {{ level.verifierTime ? secondsToTime(level.verifierTime) : "N/A" }}</p>
                    <p v-if="selected + 1 > 50">This level does not accept new records.</p>
                    <div class="tabs">
            <button class="tab type-label-lg" :class="{selected: sortByTime}" @click="sortByTime = true">
            <span class="type-label-lg">Time</span>
        </button>
        <button class="tab" :class="{selected: !sortByTime}" @click="sortByTime = false">
            <span class="type-label-lg">Date</span>
        </button>
                    </div>
                    <table class="records">
                        <tr v-for="record in [...level.records, ...(sortByTime && level.verifierTime ? [{name: level.verifier, link: 'https://youtu.be/' + level.verification, time: level.verifierTime}] : [])].sort((a,b) => (sortByTime ? a.time : a.date) - (sortByTime ? b.time : b.date))" class="record">
                            <td class="percent">
                                <p>{{ secondsToTime(record.time) }}</p>
                            </td>
                            <td class="user">
                                <a :href="record.link" target="_blank" class="type-label-lg">{{ record.name }}</a>
                            </td>
                            <td class="mobile">
                                <img v-if="record.mobile" :src="\`/assets/phone-landscape\${store?.dark ? '-dark' : ''}.svg\`" alt="Mobile">
                            </td>
                        </tr>
                    </table>
                </div>
                <div v-else class="level" style="height: 100%; justify-content: center; align-items: center;">
                    <p>(ノಠ益ಠ)ノ彡┻━┻</p>
                </div>
            </div>
            <div class="meta-container surface">
                <div class="meta">
                    <div class="errors" v-show="errors.length > 0">
                        <p class="error" v-for="error of errors">{{ error }}</p>
                    </div>
                    <template v-if="editors">
                        <h3>List Editors</h3>
                        <ol class="editors">
                            <li v-for="editor in editors.filter(e => e.role == 'owner')">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${(store.dark || store.shitty) ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                        <ol class="editors">
                            <li v-for="editor in editors.filter(e => e.role == 'admin')">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${(store.dark || store.shitty) ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                        <ol class="editors">
                            <li v-for="editor in editors.filter(e => e.role == 'seniormod')">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${(store.dark || store.shitty) ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                        <ol class="editors">
                            <li v-for="editor in editors.filter(e => e.role == 'mod')">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${(store.dark || store.shitty) ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                        <ol class="editors">
                            <li v-for="editor in editors.filter(e => e.role == 'dev')">
                                <img :src="\`/assets/\${roleIconMap[editor.role]}\${(store.dark || store.shitty) ? '-dark' : ''}.svg\`" :alt="editor.role">
                                <a v-if="editor.link" class="type-label-lg link" target="_blank" :href="editor.link">{{ editor.name }}</a>
                                <p v-else>{{ editor.name }}</p>
                            </li>
                        </ol>
                    </template>
                    <h3> Submission Requirements </h3>
                    <p>To see the platformer list submission guidelines, please click <a href="https://docs.google.com/document/d/1RhoxR_L0S0JYjxSJxJn-Lm7xd-Ee4vHokGekVSf9IVU/edit?usp=sharing" target="_blank" style="color: blue; text-decoration: underline;">here</a></p>
                </div>
            </div>
        </main>
    `,
	data: () => ({
		list: [],
		editors: [],
		loading: true,
		selected: 0,
		errors: [],
		roleIconMap,
		store,
        sortByTime: true,
		toggledShowcase: false,
	}),
	computed: {
		level() {
			return this.list[this.selected]?.[0];
		},
		video() {
			if (!this.level.ytcode) {
				return embed('https://youtu.be/'+this.level.verification);
			}

			return embed(
				`https://youtu.be/${this.toggledShowcase ? this.level.ytcode : this.level.verification}`,
			);
		},
	},
	async mounted() {
		// Hide loading spinner
		this.list = await fetchList();
		this.editors = await fetchEditors();

		// Error handling
		if (!this.list) {
			this.errors = [
				'Failed to load list. Retry in a few minutes or notify list staff.',
			];
		} else {
			if (!this.editors) {
				this.errors.push('Failed to load list editors.');
			}
		}

		this.loading = false;
	},
	methods: {
		embed,
		score,
        getFontColour,
        secondsToTime
	},
};
