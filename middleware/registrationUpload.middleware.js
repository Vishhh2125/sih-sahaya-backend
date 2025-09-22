import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Accept a superset of all registration-related file fields
export const uploadRegistrationFiles = upload.fields([
	{ name: "verifiedCollegeDocument", maxCount: 1 },
	{ name: "proofOfDesignation", maxCount: 1 },
	{ name: "logo", maxCount: 1 },
	{ name: "documents", maxCount: 10 },
	{ name: "document", maxCount: 1 }
]);

const toDoc = (file) =>
	file
		? { filename: file.originalname, contentType: file.mimetype, data: file.buffer }
		: undefined;

export const normalizeRegistrationFiles = (req, res, next) => {
	const f = req.files || {};
	if (f.verifiedCollegeDocument?.[0]) {
		req.body.verifiedCollegeDocument = toDoc(f.verifiedCollegeDocument[0]);
	}
	if (f.proofOfDesignation?.[0]) {
		req.body.proofOfDesignation = toDoc(f.proofOfDesignation[0]);
	}
	if (f.logo?.[0]) {
		req.body.logo = toDoc(f.logo[0]);
	}
	if (Array.isArray(f.documents) && f.documents.length) {
		req.body.documents = f.documents.map(toDoc);
	}
	if (f.document?.[0]) {
		req.body.document = toDoc(f.document[0]);
	}
	return next();
};


