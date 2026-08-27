import { Request, Response } from 'express';
import { NominationProposal } from '../models/NominationProposal.js';
import { proposalSchema } from '../validators/index.js';

export const submitProposal = async (req: Request, res: Response) => {
  try {
    const validated = proposalSchema.parse(req.body);
    const newProposal = await NominationProposal.create(validated);
    return res.status(201).json({
      success: true,
      message: 'Votre proposition de candidature a été reçue avec succès et sera examinée par le comité d\'organisation !',
      data: newProposal,
    });
  } catch (error: any) {
    if (error.errors) {
      return res.status(400).json({ success: false, message: error.errors[0].message });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProposals = async (req: Request, res: Response) => {
  try {
    const proposals = await NominationProposal.find().sort({ createdAt: -1 });
    return res.json({ success: true, count: proposals.length, data: proposals });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProposalStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await NominationProposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Proposition introuvable.' });
    return res.json({ success: true, data: updated });
  } catch (error: any) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
