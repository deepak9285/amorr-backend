async function getEmbedding(model, text) {
    const embeddings = await model.embed([text]);
    return embeddings.arraySync()[0];
}

const cosineSimilarity = (vecA, vecB) => {
    const dotProduct = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val ** 2, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val ** 2, 0));
    return dotProduct / (magnitudeA * magnitudeB);
};

async function calculateProfileSimilarity(profile1, profile2, model) {
    const interestsEmbedding1 = await getEmbedding(model, profile1.interests);
    const interestsEmbedding2 = await getEmbedding(model, profile2.interests);
    const lifestyleEmbedding1 = await getEmbedding(model, profile1.lifestyle);
    const lifestyleEmbedding2 = await getEmbedding(model, profile2.lifestyle);
    const introEmbedding1 = await getEmbedding(model, profile1.intro);
    const introEmbedding2 = await getEmbedding(model, profile2.intro);

    const interestsScore = cosineSimilarity(interestsEmbedding1, interestsEmbedding2);
    const lifestyleScore = cosineSimilarity(lifestyleEmbedding1, lifestyleEmbedding2);
    const introScore = cosineSimilarity(introEmbedding1, introEmbedding2);

    const educationScore = profile1.education === profile2.education ? 1 : 0;
    const languageScore = profile1.languages === profile2.languages ? 1 : 0;
    const completenessScore = (profile1.completeness + profile2.completeness) / 2;

    let rawScore =
        0.4 * interestsScore +
        0.1 * lifestyleScore +
        0.1 * educationScore +
        0.1 * completenessScore +
        0.1 * languageScore +
        0.2 * introScore

    const finalScore = 80 + (rawScore * 20);

    return finalScore;
}


export { calculateProfileSimilarity }