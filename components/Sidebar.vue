<template>
    <v-navigation-drawer permanent width="240">
        <v-list-item class="text-h6 font-weight-bold">migom.ai</v-list-item>

        <v-list density="compact" nav>
            <v-list-item
                    v-for="it in allItems"
                    :key="it.title"
                    :title="it.title"
                    :prepend-icon="it.icon"
                    :to="`/${slug(it.to)}`"
                />
        </v-list>

        <v-select
            class="mx-4 my-2"
            density="compact"
            :items="['Instagram', 'YouTube']"
            v-model="selected"
            variant="outlined"
        />
        <v-list density="compact" nav>
            <template v-if="selected === 'Instagram'">
                <v-list-item
                    v-for="it in instagramItems"
                    :key="it.title"
                    :title="it.title"
                    :prepend-icon="it.icon"
                    :to="`/${slug(it.to)}`"
                />
            </template>
            <template v-else-if="selected === 'YouTube'">
                <v-list-item
                    v-for="it in youtubeItems"
                    :key="it.title"
                    :title="it.title"
                    :prepend-icon="it.icon"
                    :to="`/${slug(it.to)}`"
                />
            </template>
        </v-list>

        <v-spacer/>
        <v-divider/>
        <v-list density="compact">
            <!-- <v-list-item prepend-icon="mdi-cog" title="Settings"/> -->
            <!-- <v-list-item prepend-icon="mdi-logout" title="Log out" @click="logout"/> -->
            <LogoutButton />
        </v-list>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
    const instagramItems = [
        // {title: 'Dashboard', icon:'mdi-view-dashboard', to: 'instagram/dashboard'},
        {title: 'Profiles Tracking', icon:'mdi-trophy', to:'instagram/profiles/videos'},
        {title: 'Hashtags Tracking', icon:'mdi-pound', to:'instagram/hashtags/videos'},
    ]

    const youtubeItems = [
        // {title: 'Dashboard', icon:'mdi-view-dashboard', to: 'youtub/dashboard'},
        {title: 'Profiles Tracking', icon:'mdi-chart-line', to:'youtub/profiles/videos'},
        {title: 'Hashtags Tracking', icon:'mdi-pound', to:'youtub/hashtags/videos'},
    ]

    const allItems = [
        {title: 'Prompts', icon:'mdi-pound', to:'prompts'},
        {title: 'Video Script', icon:'mdi-pound', to:'video-script'},
    ]
</script>

<script lang="ts">
    export default {
        data: () => ({
            selected: 'Instagram'
        }),
        methods: {
            slug(t: string) {return t.toLowerCase().replace(/\s+/g, '-')}
        }
    }
</script>