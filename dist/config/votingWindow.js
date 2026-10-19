"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVotingWindowMessage = exports.isVotingWindowOpen = void 0;
const VOTING_START = new Date('2026-10-20T19:30:00+01:00');
const VOTING_END = new Date('2026-10-27T23:59:59+01:00');
const isVotingWindowOpen = (now = new Date()) => now >= VOTING_START && now <= VOTING_END;
exports.isVotingWindowOpen = isVotingWindowOpen;
const getVotingWindowMessage = (now = new Date()) => now < VOTING_START
    ? 'Les votes ouvrent le 20 octobre 2026 à 19h30.'
    : 'Les votes sont clôturés depuis le 27 octobre 2026 à 23h59.';
exports.getVotingWindowMessage = getVotingWindowMessage;
