const { supabase } = require("../config/supabase");

async function insertMemory(whatsappId, text, embedding) {
    const { error } = await supabase.from('memories').insert({
        whatsapp_id: whatsappId,
        memory_text: text,
        embedding: embedding
    });
    if (error) {
        console.error(`Error inserting memory for ${whatsappId}:`, error);
    }
}

async function matchMemories(whatsappId, embedding) {
    const { data, error } = await supabase.rpc('match_memories', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 3,
        p_whatsapp_id: whatsappId
    });
    if (error) {
        console.error(`Error matching memories for ${whatsappId}:`, error);
        return [];
    }
    return data || [];
}

async function insertDocumentChunk(whatsappId, fileName, chunkIndex, chunkText, embedding) {
    const { error } = await supabase.from('document_chunks').insert({
        whatsapp_id: whatsappId,
        file_name: fileName,
        chunk_index: chunkIndex,
        chunk_text: chunkText,
        embedding: embedding
    });
    if (error) {
        console.error(`Error inserting document chunk for ${whatsappId}:`, error);
    }
}

async function matchDocumentChunks(whatsappId, embedding) {
    const { data, error } = await supabase.rpc('match_document_chunks', {
        query_embedding: embedding,
        match_threshold: 0.3,
        match_count: 3,
        p_whatsapp_id: whatsappId
    });
    if (error) {
        console.error(`Error matching document chunks for ${whatsappId}:`, error);
        return [];
    }
    return data || [];
}

module.exports = {
    insertMemory,
    matchMemories,
    insertDocumentChunk,
    matchDocumentChunks
};
