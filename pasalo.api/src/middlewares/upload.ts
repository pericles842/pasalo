import multer from 'multer';

// guarda los archivos en buffer
const storage = multer.memoryStorage(); 

export const upload = multer({ storage });
