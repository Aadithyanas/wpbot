const { supabase } = require("../config/supabase");

async function getProfileByWhatsappId(whatsappId) {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('whatsapp_id', whatsappId)
        .single();
    if (error && error.code !== 'PGRST116') { // Ignore single-row not found error (PGRST116 means 0 rows returned)
        console.error(`Error fetching profile for ${whatsappId}:`, error);
    }
    return data || null;
}

async function registerProfile(newProfile) {
    const { data, error } = await supabase
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();
    if (error) {
        throw error;
    }
    return data;
}

async function updateAffinityAndMood(id, affinityScore, mood) {
    const { data, error } = await supabase
        .from('user_profiles')
        .update({
            affinity_score: affinityScore,
            current_mood: mood
        })
        .eq('id', id);
    if (error) {
        console.error(`Error updating affinity/mood for profile #${id}:`, error);
    }
    return data;
}

async function updateInteractionMetrics(id, totalMessages, lastInteraction) {
    const { data, error } = await supabase
        .from('user_profiles')
        .update({
            total_messages: totalMessages,
            last_interaction: lastInteraction
        })
        .eq('id', id);
    if (error) {
        console.error(`Error updating metrics for profile #${id}:`, error);
    }
    return data;
}

async function updateSpecialNotes(id, specialNotes) {
    const { data, error } = await supabase
        .from('user_profiles')
        .update({ special_notes: specialNotes })
        .eq('id', id);
    if (error) {
        console.error(`Error updating special notes for profile #${id}:`, error);
    }
    return data;
}

async function upsertPriorityUser(phone, nickname, relationship) {
    const { data, error } = await supabase.from('user_profiles').upsert(
        { whatsapp_id: phone, nickname, relationship, is_priority: true, preferred_language: "both" },
        { onConflict: 'whatsapp_id' }
    );
    if (error) {
        throw error;
    }
    return data;
}

module.exports = {
    getProfileByWhatsappId,
    registerProfile,
    updateAffinityAndMood,
    updateInteractionMetrics,
    updateSpecialNotes,
    upsertPriorityUser
};
