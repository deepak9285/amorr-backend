import tf from "@tensorflow/tfjs";
import use from "@tensorflow-models/universal-sentence-encoder";

let model;
async function loadUSEModel() {
    try {
        model = await use.load();
        console.log("USE model loaded.");
    } catch (error) {
        console.error("Error loading USE model:", error);
    }
}
loadUSEModel();

// async function getEmbedding(model, text) {
//     const embeddings = await model.embed([text]);
//     return embeddings.arraySync()[0];
// }
async function getEmbedding(model, text) {
    try {
        if (typeof text !== "string") {
            console.warn(
                `Non-string input detected. Converting input to string: ${text}`
            );
            text = String(text);
        }

        // Normalize and trim the text
        text = text.trim().normalize("NFC");

        // Generate embeddings
        const embeddings = await model.embed([text]);

        // Use asynchronous array retrieval to prevent blocking
        const embeddingArray = await embeddings.array();

        // Dispose of the tensor to free memory
        embeddings.dispose();

        return embeddingArray[0];
    } catch (error) {
        console.error(`Error generating embedding for text: "${text}"`, error);
        // Return a zero vector or handle as per your requirement
        return Array(model.outputSize).fill(0);
    }
}
const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
    return dotProduct / (magnitudeA * magnitudeB);
};

async function calculateProfileSimilarity(profile1, profile2) {
    console.log("Calculating similarity...");

    const getFieldText = (field) =>
        typeof field === "string"
            ? field.trim().normalize("NFC")
            : String(field || "")
                .trim()
                .normalize("NFC");

    // Safely get embeddings
    const interestsEmbedding1 = await safeGetEmbedding(
        model,
        getFieldText(profile1.interests)
    );
    const interestsEmbedding2 = await safeGetEmbedding(
        model,
        getFieldText(profile2.interests)
    );
    const lifestyleEmbedding1 = await safeGetEmbedding(
        model,
        getFieldText(profile1.lifestyle)
    );
    const lifestyleEmbedding2 = await safeGetEmbedding(
        model,
        getFieldText(profile2.lifestyle)
    );
    const introEmbedding1 = await safeGetEmbedding(
        model,
        getFieldText(profile1.intro)
    );
    const introEmbedding2 = await safeGetEmbedding(
        model,
        getFieldText(profile2.intro)
    );

    // Calculate similarity scores for embeddings
    const interestsScore = cosineSimilarity(
        interestsEmbedding1,
        interestsEmbedding2
    );
    const lifestyleScore = cosineSimilarity(
        lifestyleEmbedding1,
        lifestyleEmbedding2
    );
    const introScore = cosineSimilarity(introEmbedding1, introEmbedding2);

    // Score for exact matching fields
    const educationScore = profile1.education === profile2.education ? 1 : 0;
    const languageScore = profile1.languages === profile2.languages ? 1 : 0;
    const completenessScore =
        ((profile1.completeness || 0) + (profile2.completeness || 0)) / 2;

    console.log({
        interestsScore,
        lifestyleScore,
        introScore,
        educationScore,
        languageScore,
        completenessScore,
    });

    // Calculate the weighted raw score
    const rawScore =
        0.4 * interestsScore +
        0.1 * lifestyleScore +
        0.1 * educationScore +
        0.1 * completenessScore +
        0.1 * languageScore +
        0.2 * introScore;

    // Scale raw score to the desired range (e.g., 80–100)
    const finalScore = Math.min(100, Math.max(0, 80 + rawScore * 20));

    console.log("Final similarity score:", finalScore);e

    return finalScore;
}

// Helper: Fallback for embeddings on error
async function safeGetEmbedding(model, text) {
    try {
        return await getEmbedding(model, text);
    } catch (error) {
        console.error(`Error generating embedding for text: "${text}"`, error);
        return Array(model?.outputSize).fill(0); // Fallback to zero vector
    }
}

export { calculateProfileSimilarity };
