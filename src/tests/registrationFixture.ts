const image = { name: 'portrait.png', dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aD1sAAAAASUVORK5CYII=' };
export const identityDocuments = Object.fromEntries(['passport_photo', 'national_id_front', 'national_id_back', 'chief_letter', 'certifications'].map(key => [key, image]));
export const registrationConsent = (password: string) => ({ confirmPassword: password, termsAccepted: true, privacyAccepted: true, documents: identityDocuments });
