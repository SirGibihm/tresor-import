import format from 'date-fns/format';
import parse from 'date-fns/parse';
import Big from 'big.js';
import { parseGermanNum, validateActivity } from '@/helper';


const findFee = ( line ) => {
  let fee = Big(0);
  if ( line['Vertriebsprovision in ZW (im Abrechnungskurs enthalten)'] !== 0) {
    fee = fee.plus(parseGermanNum(line['Vertriebsprovision in ZW (im Abrechnungskurs enthalten)']))
  }
  if ( line['KVG Einbehalt in ZW (im Abrechnungskurs enthalten)'] !== 0) {
    fee = fee.plus(parseGermanNum(line['KVG Einbehalt in ZW (im Abrechnungskurs enthalten)']))
  }
  return fee
}

const determineType = (typeString) => {
  if (typeString === 'Ansparplan' || typeString === 'Kauf' || typeString === 'Wiederanlage Fondsertrag') {
    return 'Buy';
  }
  if (typeString === 'Verkauf') {
    return 'Sell';
  }
  if (typeString === 'Fondsertrag (Ausschttung)') {
    return 'Dividend';
  }
}

export const canParsePage = ( content, extension ) => {
  // I am using startswith as something is fishy with the line-endings
  return extension === 'csv' && content[0].startsWith('Depotnummer;Depotposition;Ref. Nr.;Buchungsdatum;Umsatzart;Teilumsatz;Fonds;ISIN;Zahlungsbetrag in ZW;Zahlungswährung (ZW);Anteile;Abrechnungskurs in FW;Fondswährung (FW);Kursdatum;Devisenkurs  (ZW/FW);Anlagebetrag in ZW;Vertriebsprovision in ZW (im Abrechnungskurs enthalten);KVG Einbehalt in ZW (im Abrechnungskurs enthalten);Gegenwert der Anteile in ZW;Anteile zum Bestandsdatum;Barausschüttung/Steuerliquidität je Anteil in EW;Ertragswährung (EW);Bestandsdatum;Devisenkurs (ZW/EW);Barausschüttung/Steuerliquidität in ZW;Bruttobetrag VAP je Anteil in EUR;Entgelt in ZW;Entgelt in EUR;Steuern in ZW;Steuern in EUR;Devisenkurs (EUR/ZW);Art des Steuereinbehalts;Steuereinbehalt in EUR');
}

export const parsePages = content => {
  if (content.length === 0) {
    return {
      activities: [],
      status: 5,
    };
  }
  let activities = [];

  for (const line of content) {
    if ( content.length < 0) {
      continue;
    }
    const type = determineType(line.Umsatzart);
    if ( type === undefined ) {
      continue
    }
    const fee = findFee(line);
    const amount = Big(parseGermanNum(line['Zahlungsbetrag in ZW'])).minus(fee);
    const shares = Math.abs(parseGermanNum(line.Anteile))

    let activity = {
      type: determineType(line.Umsatzart),
      company: line.Fonds,
      isin: line.ISIN,
      amount: +amount.minus(fee),
      shares: Math.abs(parseGermanNum(line.Anteile)),
      price: +amount.div(shares),
      date: format(parse(line.Kursdatum, 'dd.MM.yy', new Date()), 'yyyy-MM-dd'),
      tax: parseGermanNum(line['Steuern in EUR']),
      fee: +fee,
    }
    if ( line['Devisenkurs (ZW/EW)'] !== '') {
      activity.fxRate = line['Devisenkurs (ZW/EW)'];
    }
    console.log(activity);
    activities.push(validateActivity(activity));
  }


  return {
    activities,
    status: 0,
  };
};
