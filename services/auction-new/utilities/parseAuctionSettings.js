
/**
 * parses the dynamodb Item into a more usable js object
 */
export function parseAuctionSettings(data) {
  return {
    leagueId: +data.LeagueId.N,
    auctionSettings: parseGeneralSettings(data.AuctionSettings.L),
    bidRules: parseBidRules(data.BidRules.L),
    taxRules: parseTaxRules(data.TaxRules.L)
  };
}

function parseGeneralSettings(settings) {
  return settings.map(s => {
    return {
      code: s.M.code.S,
      constrained: s.M.constrained.BOOL,
      dataType: s.M.dataType.S,
      decimalPrecision: s.M.decimalPrecision?.NULL ? null : +s.M.decimalPrecision.N,
      description: s.M.description.S,
      displayOrder: +s.M.displayOrder.N,
      displayPrefix: s.M.displayPrefix?.NULL ? null : s.M.displayPrefix.S,
      displaySuffix: s.M.displaySuffix?.NULL ? null : s.M.displaySuffix.S,
      leagueId: +s.M.leagueId.N,
      maxValue: s.M.maxValue?.NULL ? null : +s.M.maxValue.N,
      minValue: s.M.minValue?.NULL ? null : +s.M.minValue.N,
      name: s.M.name.S,
      settingClass: s.M.settingClass.S,
      settingParameterId: +s.M.settingParameterId.N,
      settingValue: s.M.settingValue?.NULL ? null : s.M.settingValue.S,
      trailingText: s.M.trailingText?.NULL ? null : s.M.trailingText.S
    }
  });
}

function parseBidRules(rules) {
  return rules.map(r => {
    return {
      auctionBidRuleId: +r.M.auctionBidRuleId.N,
      helpText: r.M.helpText.S,
      leagueId: +r.M.leagueId.N,
      maxThresholdInclusive: r.M.maxThresholdInclusive?.NULL ? null : +r.M.maxThresholdInclusive.N,
      minIncrement: +r.M.minIncrement.N,
      minThresholdExclusive: +r.M.minThresholdExclusive.N
    }
  });
}

function parseTaxRules(rules) {
  return rules.map(r => {
    return {
      auctionTaxRuleId: +r.M.auctionTaxRuleId.N,
      helpText: r.M.helpText.S,
      leagueId: +r.M.leagueId.N,
      maxThresholdInclusive: r.M.maxThresholdInclusive?.NULL ? null : +r.M.maxThresholdInclusive.N,
      taxRate: +r.M.taxRate.N,
      minThresholdExclusive: +r.M.minThresholdExclusive.N
    }
  });
}