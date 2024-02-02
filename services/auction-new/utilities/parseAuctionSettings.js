
/**
 * parses the dynamodb Item into a more usable js object
 */
export function parseAuctionSettings(data) {
  return {
    leagueId: +data.LeagueId.N,
    auctionSettings: parseGeneralSettings(data.AuctionSettings),
    bidRules: parseBidRules(data.BidRules),
    taxRules: parseTaxRules(data.TaxRules)
  };
}

function parseGeneralSettings(settings) {
  return settings.map(s => {
    return {
      code: s.code.S,
      constrained: s.constrained.BOOL,
      dataType: s.dataType.S,
      decimalPrecision: s.decimalPrecision?.NULL ? null : +s.decimalPrecision.N,
      description: s.description.S,
      displayOrder: +s.displayOrder.N,
      displayPrefix: s.displayPrefix?.NULL ? null : s.displayPrefix.S,
      displaySuffix: s.displaySuffix?.NULL ? null : s.displaySuffix.S,
      leagueId: +s.leagueId.N,
      maxValue: s.maxValue?.NULL ? null : +s.maxValue.N,
      minValue: s.minValue?.NULL ? null : +s.minValue.N,
      name: s.name.S,
      settingClass: s.settingClass.S,
      settingParameterId: +s.settingParameterId.N,
      settingValue: s.settingValue?.NULL ? null : s.settingValue.S,
      trailingText: s.trailingText?.NULL ? null : s.trailingText.S
    }
  });
}

function parseBidRules(rules) {
  return rules.map(r => {
    return {
      auctionBidRuleId: +r.auctionBidRuleId.N,
      helpText: r.helpText.S,
      leagueId: +r.leagueId.N,
      maxThresholdInclusive: r.maxThresholdInclusive?.NULL ? null : +r.maxThresholdInclusive.N,
      minIncrement: +r.minIncrement.N,
      minThresholdExclusive: +r.minThresholdExclusive.N
    }
  });
}

function parseTaxRules(rules) {
  return rules.map(r => {
    return {
      auctionTaxRuleId: +r.auctionTaxRuleId.N,
      helpText: r.helpText.S,
      leagueId: +r.leagueId.N,
      maxThresholdInclusive: r.maxThresholdInclusive?.NULL ? null : +r.maxThresholdInclusive.N,
      taxRate: +r.taxRate.N,
      minThresholdExclusive: +r.minThresholdExclusive.N
    }
  });
}