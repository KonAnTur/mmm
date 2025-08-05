<template>
    <v-container fluid>

        <!-- Заголовок -->
        <h2 class="mb-4">Dashboard</h2>

        <!-- Шапка -->
        <v-row dense>
            <!-- Welcome -->
            <v-col cols="12" md="6">
                <v-card min-height="90" class="d-flex align-center justify-center text-h6 font-weight-medium">
                Welcome back, {{ name }}!
                </v-card>
            </v-col>

            <!-- Plan -->
            <v-col cols="12" md="6">
                <v-card min-height="90" class="pa-4 d-flex justify-space-between align-center">
                <div>
                    <div class="text-body-1 font-weight-medium">
                        Current plan: {{ plan }}
                    </div>
                    <div class="text-caption">
                        Your current plan ends in {{ Math.ceil((+planEnds - Date.now())/864e5) }} days
                    </div>
                </div>
                <v-btn color="primary" size="small">Change Plan</v-btn>
                </v-card>
            </v-col>
        </v-row>

        <!-- Usage tiles -->
        <v-row dense class="mt-4">
            <v-col v-for="s in stats" :key="s.key" cols="12" sm="6" md="4">
                <FeatureUsageCard v-bind="s"/>
            </v-col>
        </v-row>

        <!-- Help tiles -->
        <v-row dense class="mt-4">
            <v-col v-for="(h,i) in helps" :key="i" cols="12" sm="6" md="3">
                <HelpCard v-bind="h"/>
            </v-col>
        </v-row>
    </v-container>
</template>


<script setup lang="ts">
    import { useUser } from '@/composables/useUser'
    import { stats }   from '@/composables/useStats'
    import FeatureUsageCard from '@/components/FeatureUsageCard.vue'
    import HelpCard         from '@/components/HelpCard.vue'

    const { name, plan, planEnds } = useUser()

    /* демо-тексты подсказок */
    const helps = [
        { title:'How to add competitors', text:'To add competitors you need past instagram nickname on page competitors tracker…' },
        { title:'How to add hashtags',    text:'Go to Hashtags Tracker and paste required tag that you want to analyse…' },
        { title:'How to add prompts',     text:'Click on AI Prompts and describe your idea then press Add prompt…' },
        { title:'How to invite team',     text:'Open Team Members, enter email and assign role then click Invite…' }
    ]
</script>