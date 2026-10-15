"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProposalStatus = exports.getProposals = exports.submitProposal = void 0;
const NominationProposal_js_1 = require("../models/NominationProposal.js");
const index_js_1 = require("../validators/index.js");
const submitProposal = async (req, res) => {
    try {
        const validated = index_js_1.proposalSchema.parse(req.body);
        const newProposal = await NominationProposal_js_1.NominationProposal.create(validated);
        return res.status(201).json({
            success: true,
            message: 'Votre proposition de candidature a été reçue avec succès et sera examinée par le comité d\'organisation !',
            data: newProposal,
        });
    }
    catch (error) {
        if (error.errors) {
            return res.status(400).json({ success: false, message: error.errors[0].message });
        }
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.submitProposal = submitProposal;
const getProposals = async (req, res) => {
    try {
        const proposals = await NominationProposal_js_1.NominationProposal.find().sort({ createdAt: -1 });
        return res.json({ success: true, count: proposals.length, data: proposals });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProposals = getProposals;
const updateProposalStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await NominationProposal_js_1.NominationProposal.findByIdAndUpdate(req.params.id, { status }, { new: true });
        if (!updated)
            return res.status(404).json({ success: false, message: 'Proposition introuvable.' });
        return res.json({ success: true, data: updated });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }
};
exports.updateProposalStatus = updateProposalStatus;
