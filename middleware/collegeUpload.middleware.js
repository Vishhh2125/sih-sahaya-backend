import multer from "multer";

// Memory storage keeps files in RAM and exposes buffer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Expect two files: verifiedCollegeDocument and proofOfDesignation
export const uploadCollegeDocs = upload.fields([
	{ name: "verifiedCollegeDocument", maxCount: 1 },
	{ name: "proofOfDesignation", maxCount: 1 }
]);

// Transform uploaded files into the expected schema objects on req.body
export const normalizeCollegeDocs = (req, res, next) => {
	const ensureDoc = (fileArray) => {
		if (!fileArray || fileArray.length === 0) return undefined;
		const file = fileArray[0];
		return {
			filename: file.originalname,
			contentType: file.mimetype,
			data: file.buffer
		};
	};

	req.body.verifiedCollegeDocument = ensureDoc(
		req.files?.verifiedCollegeDocument
	);
	req.body.proofOfDesignation = ensureDoc(req.files?.proofOfDesignation);

	return next();
};


