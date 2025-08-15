module.exports = {
  PLANS: {
    FREE: { maxAgents: 1, knowledgeUpload: true, drafts: true, autopilot: false, tokenQuota: 5000, storageQuotaMB: 50, fileMaxMB: 10 },
    PRO: { maxAgents: 3, knowledgeUpload: true, drafts: true, autopilot: true, tokenQuota: 50000, storageQuotaMB: 500, fileMaxMB: 50 },
    TEAM: { maxAgents: 10, knowledgeUpload: true, drafts: true, autopilot: true, tokenQuota: 200000, storageQuotaMB: 2000, fileMaxMB: 200 },
    ENTERPRISE: { maxAgents: 99, knowledgeUpload: true, drafts: true, autopilot: true, tokenQuota: 1000000, storageQuotaMB: 10000, fileMaxMB: 500 }
  }
}
