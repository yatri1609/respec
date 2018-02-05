/*jshint
    forin: false
*/
/*global hb*/

// Module w3c/headers
// Generate the headers material based on the provided configuration.
// CONFIGURATION
//  - specStatus: the short code for the specification's maturity level or type (required)
//  - shortName: the small name that is used after /TR/ in published reports (required)
//  - editors: an array of people editing the document (at least one is required). People
//      are defined using:
//          - name: the person's name (required)
//          - url: URI for the person's home page
//          - company: the person's company
//          - companyURL: the URI for the person's company
//          - mailto: the person's email
//          - note: a note on the person (e.g. former editor)
//  - authors: an array of people who are contributing authors of the document.
//  - subtitle: a subtitle for the specification
//  - publishDate: the date to use for the publication, default to document.lastModified, and
//      failing that to now. The format is YYYY-MM-DD or a Date object.
//  - previousPublishDate: the date on which the previous version was published.
//  - previousMaturity: the specStatus of the previous version
//  - errata: the URI of the errata document, if any
//  - alternateFormats: a list of alternate formats for the document, each of which being
//      defined by:
//          - uri: the URI to the alternate
//          - label: a label for the alternate
//          - lang: optional language
//          - type: optional MIME type
//  - logos: a list of logos to use instead of the W3C logo, each of which being defined by:
//          - src: the URI to the logo (target of <img src=>)
//          - alt: alternate text for the image (<img alt=>), defaults to "Logo" or "Logo 1", "Logo 2", ...
//            if src is not specified, this is the text of the "logo"
//          - height: optional height of the logo (<img height=>)
//          - width: optional width of the logo (<img width=>)
//          - url: the URI to the organization represented by the logo (target of <a href=>)
//          - id: optional id for the logo, permits custom CSS (wraps logo in <span id=>)
//          - each logo element must specifiy either src or alt
//  - testSuiteURI: the URI to the test suite, if any
//  - implementationReportURI: the URI to the implementation report, if any
//  - bugTracker: and object with the following details
//      - open: pointer to the list of open bugs
//      - new: pointer to where to raise new bugs
//  - noRecTrack: set to true if this document is not intended to be on the Recommendation track
//  - edDraftURI: the URI of the Editor's Draft for this document, if any. Required if
//      specStatus is set to "ED".
//  - additionalCopyrightHolders: a copyright owner in addition to W3C (or the only one if specStatus
//      is unofficial)
//  - overrideCopyright: provides markup to completely override the copyright
//  - copyrightStart: the year from which the copyright starts running
//  - prevED: the URI of the previous Editor's Draft if it has moved
//  - prevRecShortname: the short name of the previous Recommendation, if the name has changed
//  - prevRecURI: the URI of the previous Recommendation if not directly generated from
//    prevRecShortname.
//  - wg: the name of the WG in charge of the document. This may be an array in which case wgURI
//      and wgPatentURI need to be arrays as well, of the same length and in the same order
//  - wgURI: the URI to the group's page, or an array of such
//  - wgPatentURI: the URI to the group's patent information page, or an array of such. NOTE: this
//      is VERY IMPORTANT information to provide and get right, do not just paste this without checking
//      that you're doing it right
//  - wgPublicList: the name of the mailing list where discussion takes place. Note that this cannot
//      be an array as it is assumed that there is a single list to discuss the document, even if it
//      is handled by multiple groups
//  - charterDisclosureURI: used for IGs (when publishing IG-NOTEs) to provide a link to the IPR commitment
//      defined in their charter.
//  - addPatentNote: used to add patent-related information to the SotD, for instance if there's an open
//      PAG on the document.
//  - thisVersion: the URI to the dated current version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - latestVersion: the URI to the latest (undated) version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - prevVersion: the URI to the previous (dated) version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - subjectPrefix: the string that is expected to be used as a subject prefix when posting to the mailing
//      list of the group.
//  - otherLinks: an array of other links that you might want in the header (e.g., link github, twitter, etc).
//         Example of usage: [{key: "foo", href:"https://b"}, {key: "bar", href:"https://"}].
//         Allowed values are:
//          - key: the key for the <dt> (e.g., "Bug Tracker"). Required.
//          - value: The value that will appear in the <dd> (e.g., "GitHub"). Optional.
//          - href: a URL for the value (e.g., "https://foo.com/issues"). Optional.
//          - class: a string representing CSS classes. Optional.
//  - license: can be one of the following
//      - "w3c", currently the default (restrictive) license
//      - "cc-by", which is experimentally available in some groups (but likely to be phased out).
//          Note that this is a dual licensing regime.
//      - "cc0", an extremely permissive license. It is only recommended if you are working on a document that is
//          intended to be pushed to the WHATWG.
//      - "w3c-software", a permissive and attributions license (but GPL-compatible).
//      - "w3c-software-doc", the W3C Software and Document License
//            https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
import { concatDate, joinAnd, ISODate } from "core/utils";
import hb from "handlebars.runtime";
import { pub } from "core/pubsubhub";
import tmpls from "templates";

export const name = "w3c/headers";

const cgbgHeadersTmpl = tmpls["cgbg-headers.html"];
const headersTmpl = tmpls["headers.html"];

const W3CDate = new Intl.DateTimeFormat(["en-AU"], {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "2-digit",
});

hb.registerHelper("showPeople", function(name, items = []) {
  // stuff to handle RDFa
  var re = "",
    rp = "",
    rm = "",
    rn = "",
    rwu = "",
    rpu = "",
    bn = "",
    editorid = "",
    propSeeAlso = "";
  if (this.doRDFa) {
    if (name === "Editor") {
      bn = "_:editor0";
      re = " property='bibo:editor' resource='" + bn + "'";
      rp = " property='rdf:first' typeof='foaf:Person'";
    } else if (name === "Author") {
      rp = " property='dc:contributor' typeof='foaf:Person'";
    }
    rn = " property='foaf:name'";
    rm = " property='foaf:mbox'";
    rwu = " property='foaf:workplaceHomepage'";
    rpu = " property='foaf:homepage'";
    propSeeAlso = " property='rdfs:seeAlso'";
  }
  var ret = "";
  for (var i = 0, n = items.length; i < n; i++) {
    var p = items[i];
    if (p.w3cid) {
      editorid = " data-editor-id='" + parseInt(p.w3cid, 10) + "'";
    }
    if (this.doRDFa) {
      ret +=
        "<dd class='p-author h-card vcard' " +
        re +
        editorid +
        "><span" +
        rp +
        ">";
      if (name === "Editor") {
        // Update to next sequence in rdf:List
        bn = i < n - 1 ? "_:editor" + (i + 1) : "rdf:nil";
        re = " resource='" + bn + "'";
      }
    } else {
      ret += "<dd class='p-author h-card vcard'" + editorid + ">";
    }
    if (p.url) {
      if (this.doRDFa) {
        ret +=
          "<meta" +
          rn +
          " content='" +
          p.name +
          "'><a class='u-url url p-name fn' " +
          rpu +
          " href='" +
          p.url +
          "'>" +
          p.name +
          "</a>";
      } else
        ret +=
          "<a class='u-url url p-name fn' href='" +
          p.url +
          "'>" +
          p.name +
          "</a>";
    } else {
      ret += "<span" + rn + " class='p-name fn'>" + p.name + "</span>";
    }
    if (p.company) {
      ret += ", ";
      if (p.companyURL)
        ret +=
          "<a" +
          rwu +
          " class='p-org org h-org h-card' href='" +
          p.companyURL +
          "'>" +
          p.company +
          "</a>";
      else ret += p.company;
    }
    if (p.mailto) {
      ret +=
        ", <span class='ed_mailto'><a class='u-email email' " +
        rm +
        " href='mailto:" +
        p.mailto +
        "'>" +
        p.mailto +
        "</a></span>";
    }
    if (p.note) ret += " (" + p.note + ")";
    if (p.extras) {
      var self = this;
      var resultHTML = p.extras
        // Remove empty names
        .filter(function(extra) {
          return extra.name && extra.name.trim();
        })
        // Convert to HTML
        .map(function(extra) {
          var span = document.createElement("span");
          var textContainer = span;
          if (extra.class) {
            span.className = extra.class;
          }
          if (extra.href) {
            var a = document.createElement("a");
            span.appendChild(a);
            a.href = extra.href;
            textContainer = a;
            if (self.doRDFa) {
              a.setAttribute("property", "rdfs:seeAlso");
            }
          }
          textContainer.innerHTML = extra.name;
          return span.outerHTML;
        })
        .join(", ");
      ret += ", " + resultHTML;
    }
    if (this.doRDFa) {
      ret += "</span>\n";
      if (name === "Editor")
        ret += "<span property='rdf:rest' resource='" + bn + "'></span>\n";
    }
    ret += "</dd>\n";
  }
  return new hb.SafeString(ret);
});

function toLogo(obj) {
  const a = document.createElement("a");
  if (!obj.alt) {
    const msg = "Found spec logo without an `alt` attribute. See dev console.";
    a.classList.add("respec-offending-element");
    pub("warn", msg);
    console.warn("warn", msg, a);
  }
  a.href = obj.href ? obj.href : "";
  a.classList.add("logo");
  hyperHTML.bind(a)`
      <img
        id="${obj.id}"
        alt="${obj.alt}"
        width="${obj.width}"
        height="${obj.height}">
  `;
  // avoid triggering 404 requests from dynamically generated
  // hyperHTML attribute values
  a.querySelector("img").src = obj.src;
  return a;
}

hb.registerHelper("showLogos", logos => {
  const p = document.createElement("p");
  hyperHTML.bind(p)`${logos.map(toLogo)}`;
  return p.outerHTML;
});

const status2maturity = {
  FPWD: "WD",
  LC: "WD",
  FPLC: "WD",
  "FPWD-NOTE": "NOTE",
  "WD-NOTE": "WD",
  "LC-NOTE": "LC",
  "IG-NOTE": "NOTE",
  "WG-NOTE": "NOTE",
};

const status2rdf = {
  NOTE: "w3p:NOTE",
  WD: "w3p:WD",
  LC: "w3p:LastCall",
  CR: "w3p:CR",
  PR: "w3p:PR",
  REC: "w3p:REC",
  PER: "w3p:PER",
  RSCND: "w3p:RSCND",
};
const status2text = {
  NOTE: "Working Group Note",
  "WG-NOTE": "Working Group Note",
  "CG-NOTE": "Co-ordination Group Note",
  "IG-NOTE": "Interest Group Note",
  "Member-SUBM": "Member Submission",
  "Team-SUBM": "Team Submission",
  MO: "Member-Only Document",
  ED: "Editor's Draft",
  FPWD: "First Public Working Draft",
  WD: "Working Draft",
  "FPWD-NOTE": "Working Group Note",
  "WD-NOTE": "Working Draft",
  "LC-NOTE": "Working Draft",
  FPLC: "First Public and Last Call Working Draft",
  LC: "Last Call Working Draft",
  CR: "Candidate Recommendation",
  PR: "Proposed Recommendation",
  PER: "Proposed Edited Recommendation",
  REC: "Recommendation",
  RSCND: "Rescinded Recommendation",
  unofficial: "Unofficial Draft",
  base: "Document",
  finding: "TAG Finding",
  "draft-finding": "Draft TAG Finding",
  "CG-DRAFT": "Draft Community Group Report",
  "CG-FINAL": "Final Community Group Report",
  "BG-DRAFT": "Draft Business Group Report",
  "BG-FINAL": "Final Business Group Report",
};
const status2long = {
  "FPWD-NOTE": "First Public Working Group Note",
  "LC-NOTE": "Last Call Working Draft",
};
const recTrackStatus = ["FPWD", "WD", "FPLC", "LC", "CR", "PR", "PER", "REC"];
const noTrackStatus = [
  "MO",
  "unofficial",
  "base",
  "finding",
  "draft-finding",
  "CG-DRAFT",
  "CG-FINAL",
  "BG-DRAFT",
  "BG-FINAL",
];
const cgbg = ["CG-DRAFT", "CG-FINAL", "BG-DRAFT", "BG-FINAL"];
const precededByAn = ["ED", "IG-NOTE"];
const licenses = {
  cc0: {
    name: "Creative Commons 0 Public Domain Dedication",
    short: "CC0",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
  },
  "w3c-software": {
    name: "W3C Software Notice and License",
    short: "W3C Software",
    url: "https://www.w3.org/Consortium/Legal/2002/copyright-software-20021231",
  },
  "w3c-software-doc": {
    name: "W3C Software and Document Notice and License",
    short: "W3C Software and Document",
    url:
      "https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document",
  },
  "cc-by": {
    name: "Creative Commons Attribution 4.0 International Public License",
    short: "CC-BY",
    url: "https://creativecommons.org/licenses/by/4.0/legalcode",
  },
};

const baseLogo = Object.freeze({
  id: "",
  alt: "",
  href: "",
  src: "",
  height: "48",
  width: "72",
});

function validateDateAndRecover(conf, prop, fallbackDate = new Date()) {
  const date = conf[prop] ? new Date(conf[prop]) : new Date(fallbackDate);
  // if date is valid
  if (Number.isFinite(date.valueOf())) {
    const formattedDate = ISODate.format(date);
    return new Date(formattedDate);
  }
  const msg =
    `[\`${prop}\`](https://github.com/w3c/respec/wiki/${prop}) ` +
    `is not a valid date: "${conf[prop]}". Expected format 'YYYY-MM-DD'.`;
  pub("error", msg);
  return new Date(ISODate.format(new Date()));
}

export function run(conf, doc, cb) {
  // TODO: move to w3c defaults
  if (!conf.logos) {
    conf.logos = [];
  }
  // Default include RDFa document metadata
  if (conf.doRDFa === undefined) conf.doRDFa = true;
  // validate configuration and derive new configuration values
  if (!conf.license) {
    conf.license = "w3c-software-doc";
  }
  conf.isCCBY = conf.license === "cc-by";
  conf.isW3CSoftAndDocLicense = conf.license === "w3c-software-doc";
  if (["cc-by", "w3c"].includes(conf.license)) {
    let msg = `You cannot use license "\`${conf.license}\`" with W3C Specs. `;
    msg += `Please set \`respecConfig.license: "w3c-software-doc"\` instead.`;
    pub("error", msg);
  }
  conf.licenseInfo = licenses[conf.license];
  conf.isCGBG = cgbg.includes(conf.specStatus);
  conf.isCGFinal = conf.isCGBG && /G-FINAL$/.test(conf.specStatus);
  conf.isBasic = conf.specStatus === "base";
  conf.isRegular = !conf.isCGBG && !conf.isBasic;
  if (!conf.specStatus) {
    pub("error", "Missing required configuration: `specStatus`");
  }
  if (conf.isRegular && !conf.shortName) {
    pub("error", "Missing required configuration: `shortName`");
  }
  conf.title = doc.title || "No Title";
  if (!conf.subtitle) conf.subtitle = "";
  conf.publishDate = validateDateAndRecover(
    conf,
    "publishDate",
    doc.lastModified
  );
  conf.publishYear = conf.publishDate.getUTCFullYear();
  conf.publishHumanDate = W3CDate.format(conf.publishDate);
  conf.isNoTrack = noTrackStatus.includes(conf.specStatus);
  conf.isRecTrack = conf.noRecTrack
    ? false
    : recTrackStatus.includes(conf.specStatus);
  conf.isMemberSubmission = conf.specStatus === "Member-SUBM";
  if (conf.isMemberSubmission) {
    const memSubmissionLogo = {
      alt: "W3C Member Submission",
      href: "https://www.w3.org/Submission/",
      src: "https://www.w3.org/Icons/member_subm-v.svg",
      width: "211",
    };
    conf.logos.push({ ...baseLogo, ...memSubmissionLogo });
  }
  conf.isTeamSubmission = conf.specStatus === "Team-SUBM";
  if (conf.isTeamSubmission) {
    const teamSubmissionLogo = {
      alt: "W3C Team Submission",
      href: "https://www.w3.org/TeamSubmission/",
      src: "https://www.w3.org/Icons/team_subm-v.svg",
      width: "211",
    };
    conf.logos.push({ ...baseLogo, ...teamSubmissionLogo });
  }
  conf.isSubmission = conf.isMemberSubmission || conf.isTeamSubmission;
  conf.anOrA = precededByAn.includes(conf.specStatus) ? "an" : "a";
  conf.isTagFinding =
    conf.specStatus === "finding" || conf.specStatus === "draft-finding";
  if (!conf.edDraftURI) {
    conf.edDraftURI = "";
    if (conf.specStatus === "ED")
      pub("warn", "Editor's Drafts should set edDraftURI.");
  }
  conf.maturity = status2maturity[conf.specStatus]
    ? status2maturity[conf.specStatus]
    : conf.specStatus;
  var publishSpace = "TR";
  if (conf.specStatus === "Member-SUBM") publishSpace = "Submission";
  else if (conf.specStatus === "Team-SUBM") publishSpace = "TeamSubmission";
  if (conf.isRegular)
    conf.thisVersion =
      "https://www.w3.org/" +
      publishSpace +
      "/" +
      conf.publishDate.getUTCFullYear() +
      "/" +
      conf.maturity +
      "-" +
      conf.shortName +
      "-" +
      concatDate(conf.publishDate) +
      "/";
  if (conf.specStatus === "ED") conf.thisVersion = conf.edDraftURI;
  if (conf.isRegular)
    conf.latestVersion =
      "https://www.w3.org/" + publishSpace + "/" + conf.shortName + "/";
  if (conf.isTagFinding) {
    conf.latestVersion = "https://www.w3.org/2001/tag/doc/" + conf.shortName;
    conf.thisVersion =
      conf.latestVersion + "-" + ISODate.format(conf.publishDate);
  }
  if (conf.previousPublishDate) {
    if (!conf.previousMaturity && !conf.isTagFinding) {
      pub("error", "`previousPublishDate` is set, but not `previousMaturity`.");
    }

    conf.previousPublishDate = validateDateAndRecover(
      conf,
      "previousPublishDate"
    );

    var pmat = status2maturity[conf.previousMaturity]
      ? status2maturity[conf.previousMaturity]
      : conf.previousMaturity;
    if (conf.isTagFinding) {
      conf.prevVersion =
        conf.latestVersion + "-" + ISODate.format(conf.previousPublishDate);
    } else if (conf.isCGBG) {
      conf.prevVersion = conf.prevVersion || "";
    } else if (conf.isBasic) {
      conf.prevVersion = "";
    } else {
      conf.prevVersion =
        "https://www.w3.org/TR/" +
        conf.previousPublishDate.getUTCFullYear() +
        "/" +
        pmat +
        "-" +
        conf.shortName +
        "-" +
        concatDate(conf.previousPublishDate) +
        "/";
    }
  } else {
    if (
      !/NOTE$/.test(conf.specStatus) &&
      conf.specStatus !== "FPWD" &&
      conf.specStatus !== "FPLC" &&
      conf.specStatus !== "ED" &&
      !conf.noRecTrack &&
      !conf.isNoTrack &&
      !conf.isSubmission
    )
      pub(
        "error",
        "Document on track but no previous version:" +
          " Add `previousMaturity`, and `previousPublishDate` to ReSpec's config."
      );
    if (!conf.prevVersion) conf.prevVersion = "";
  }
  if (conf.prevRecShortname && !conf.prevRecURI)
    conf.prevRecURI = "https://www.w3.org/TR/" + conf.prevRecShortname;
  if (!conf.editors || conf.editors.length === 0)
    pub("error", "At least one editor is required");
  var peopCheck = function(it) {
    if (!it.name) pub("error", "All authors and editors must have a name.");
  };
  if (conf.editors) {
    conf.editors.forEach(peopCheck);
  }
  if (conf.authors) {
    conf.authors.forEach(peopCheck);
  }
  conf.multipleEditors = conf.editors && conf.editors.length > 1;
  conf.multipleAuthors = conf.authors && conf.authors.length > 1;
  $.each(conf.alternateFormats || [], function(i, it) {
    if (!it.uri || !it.label)
      pub("error", "All alternate formats must have a uri and a label.");
  });
  conf.multipleAlternates =
    conf.alternateFormats && conf.alternateFormats.length > 1;
  conf.alternatesHTML =
    conf.alternateFormats &&
    joinAnd(conf.alternateFormats, function(alt) {
      var optional =
        alt.hasOwnProperty("lang") && alt.lang
          ? " hreflang='" + alt.lang + "'"
          : "";
      optional +=
        alt.hasOwnProperty("type") && alt.type
          ? " type='" + alt.type + "'"
          : "";
      return (
        "<a rel='alternate' href='" +
        alt.uri +
        "'" +
        optional +
        ">" +
        alt.label +
        "</a>"
      );
    });
  if (conf.bugTracker) {
    if (conf.bugTracker["new"] && conf.bugTracker.open) {
      conf.bugTrackerHTML =
        "<a href='" +
        conf.bugTracker["new"] +
        "'>" +
        conf.l10n.file_a_bug +
        "</a> " +
        conf.l10n.open_parens +
        "<a href='" +
        conf.bugTracker.open +
        "'>" +
        conf.l10n.open_bugs +
        "</a>" +
        conf.l10n.close_parens;
    } else if (conf.bugTracker.open) {
      conf.bugTrackerHTML =
        "<a href='" + conf.bugTracker.open + "'>open bugs</a>";
    } else if (conf.bugTracker["new"]) {
      conf.bugTrackerHTML =
        "<a href='" + conf.bugTracker["new"] + "'>file a bug</a>";
    }
  }
  if (conf.copyrightStart && conf.copyrightStart == conf.publishYear)
    conf.copyrightStart = "";
  for (var k in status2text) {
    if (status2long[k]) continue;
    status2long[k] = status2text[k];
  }
  conf.longStatus = status2long[conf.specStatus];
  conf.textStatus = status2text[conf.specStatus];
  if (status2rdf[conf.specStatus]) {
    conf.rdfStatus = status2rdf[conf.specStatus];
  }
  conf.showThisVersion = !conf.isNoTrack || conf.isTagFinding;
  conf.showPreviousVersion =
    conf.specStatus !== "FPWD" &&
    conf.specStatus !== "FPLC" &&
    conf.specStatus !== "ED" &&
    !conf.isNoTrack &&
    !conf.isSubmission;
  if (/NOTE$/.test(conf.specStatus) && !conf.prevVersion)
    conf.showPreviousVersion = false;
  if (conf.isTagFinding)
    conf.showPreviousVersion = conf.previousPublishDate ? true : false;
  conf.notYetRec = conf.isRecTrack && conf.specStatus !== "REC";
  conf.isRec = conf.isRecTrack && conf.specStatus === "REC";
  if (conf.isRec && !conf.errata)
    pub("error", "Recommendations must have an errata link.");
  conf.notRec = conf.specStatus !== "REC";
  conf.isUnofficial = conf.specStatus === "unofficial";
  conf.prependW3C = !conf.isUnofficial;
  conf.isED = conf.specStatus === "ED";
  conf.isCR = conf.specStatus === "CR";
  conf.isPR = conf.specStatus === "PR";
  conf.isPER = conf.specStatus === "PER";
  conf.isMO = conf.specStatus === "MO";
  conf.isNote = ["FPWD-NOTE", "WG-NOTE"].includes(conf.specStatus);
  conf.isIGNote = conf.specStatus === "IG-NOTE";
  conf.dashDate = ISODate.format(conf.publishDate);
  conf.publishISODate = conf.publishDate.toISOString();
  conf.shortISODate = ISODate.format(conf.publishDate);
  conf.processVersion = conf.processVersion || "2018";
  Object.defineProperty(conf, "wgId", {
    get() {
      if (!this.hasOwnProperty("wgPatentURI")) {
        return "";
      }
      // it's always at "pp-impl" + 1
      const urlParts = this.wgPatentURI.split("/");
      const pos = urlParts.findIndex(item => item === "pp-impl") + 1;
      return urlParts[pos] || "";
    },
  });
  if (conf.processVersion == "2014" || conf.processVersion == "2015" || conf.processVersion == "2017") {
    pub(
      "warn",
      "Process " + conf.processVersion + " has been superceded by Process 2018."
    );
    conf.processVersion = "2018";
  }
  conf.isNewProcess = conf.processVersion == "2018";
  // configuration done - yay!

  // annotate html element with RFDa
  if (conf.doRDFa) {
    if (conf.rdfStatus)
      $("html").attr("typeof", "bibo:Document " + conf.rdfStatus);
    else $("html").attr("typeof", "bibo:Document ");
    var prefixes =
      "bibo: http://purl.org/ontology/bibo/ w3p: http://www.w3.org/2001/02pd/rec54#";
    $("html").attr("prefix", prefixes);
    $("html>head").prepend(
      $("<meta lang='' property='dc:language' content='en'>")
    );
  }
  // insert into document and mark with microformat
  var bp;
  if (conf.isCGBG) bp = cgbgHeadersTmpl(conf);
  else bp = headersTmpl(conf);
  $("body", doc)
    .prepend($(bp))
    .addClass("h-entry");

  // handle SotD
  var sotd =
    document.body.querySelector("#sotd") || document.createElement("section");
  if ((conf.isCGBG || !conf.isNoTrack || conf.isTagFinding) && !sotd.id) {
    pub(
      "error",
      "A custom SotD paragraph is required for your type of document."
    );
  }
  sotd.id = sotd.id || "stod";
  sotd.classList.add("introductory");
  // NOTE:
  //  When arrays, wg and wgURI have to be the same length (and in the same order).
  //  Technically wgURI could be longer but the rest is ignored.
  //  However wgPatentURI can be shorter. This covers the case where multiple groups
  //  publish together but some aren't used for patent policy purposes (typically this
  //  happens when one is foolish enough to do joint work with the TAG). In such cases,
  //  the groups whose patent policy applies need to be listed first, and wgPatentURI
  //  can be shorter — but it still needs to be an array.
  var wgPotentialArray = [conf.wg, conf.wgURI, conf.wgPatentURI];
  if (
    wgPotentialArray.some(item => Array.isArray(item)) &&
    !wgPotentialArray.every(item => Array.isArray(item))
  ) {
    pub(
      "error",
      "If one of '`wg`', '`wgURI`', or '`wgPatentURI`' is an array, they all have to be."
    );
  }
  if (Array.isArray(conf.wg)) {
    conf.multipleWGs = conf.wg.length > 1;
    conf.wgHTML = joinAnd(conf.wg, function(wg, idx) {
      return "the <a href='" + conf.wgURI[idx] + "'>" + wg + "</a>";
    });
    var pats = [];
    for (var i = 0, n = conf.wg.length; i < n; i++) {
      pats.push(
        "a <a href='" +
          conf.wgPatentURI[i] +
          "' rel='disclosure'>" +
          "public list of any patent disclosures  (" +
          conf.wg[i] +
          ")</a>"
      );
    }
    conf.wgPatentHTML = joinAnd(pats);
  } else {
    conf.multipleWGs = false;
    conf.wgHTML = "the <a href='" + conf.wgURI + "'>" + conf.wg + "</a>";
  }
  if (conf.specStatus === "PR" && !conf.crEnd) {
    pub(
      "error",
      `\`specStatus\` is "PR" but no \`crEnd\` is specified (needed to indicate end of previous CR).`
    );
  }

  if (conf.specStatus === "CR" && !conf.crEnd) {
    pub(
      "error",
      `\`specStatus\` is "CR", but no \`crEnd\` is specified in Respec config.`
    );
  }
  conf.crEnd = validateDateAndRecover(conf, "crEnd");
  conf.humanCREnd = W3CDate.format(conf.crEnd);

  if (conf.specStatus === "PR" && !conf.prEnd) {
    pub("error", `\`specStatus\` is "PR" but no \`prEnd\` is specified.`);
  }
  conf.prEnd = validateDateAndRecover(conf, "prEnd");
  conf.humanPREnd = W3CDate.format(conf.prEnd);

  if (conf.specStatus === "PER" && !conf.perEnd) {
    pub("error", "Status is PER but no perEnd is specified");
  }
  conf.perEnd = validateDateAndRecover(conf, "perEnd");
  conf.humanPEREnd = W3CDate.format(conf.perEnd);

  conf.recNotExpected = conf.recNotExpected
    ? true
    : !conf.isRecTrack &&
      conf.maturity == "WD" &&
      conf.specStatus !== "FPWD-NOTE";
  if (conf.isIGNote && !conf.charterDisclosureURI)
    pub(
      "error",
      "IG-NOTEs must link to charter's disclosure section using `charterDisclosureURI`."
    );
  // ensure subjectPrefix is encoded before using template
  if (conf.subjectPrefix !== "")
    conf.subjectPrefixEnc = encodeURIComponent(conf.subjectPrefix);

  sotd.innerHTML = populateSoTD(conf, sotd);

  if (!conf.implementationReportURI && (conf.isCR || conf.isPR || conf.isRec)) {
    pub(
      "error",
      "CR, PR, and REC documents need to have an `implementationReportURI` defined."
    );
  }
  if (conf.isTagFinding && !conf.additionalContent) {
    pub(
      "warn",
      "ReSpec does not support automated SotD generation for TAG findings, " +
        "please add the prerequisite content in the 'sotd' section"
    );
  }
  // Requested by https://github.com/w3c/respec/issues/504
  // Makes a record of a few auto-generated things.
  pub("amend-user-config", {
    publishISODate: conf.publishISODate,
    generatedSubtitle: `${conf.longStatus} ${conf.publishHumanDate}`,
  });
  cb();
}

function populateSoTD(conf, sotd) {
  const sotdClone = sotd.cloneNode(true);
  const additionalNodes = document.createDocumentFragment();
  const additionalContent = document.createElement("temp");
  // we collect everything until we hit a section,
  // that becomes the custom content.
  while (sotdClone.hasChildNodes()) {
    if (
      sotdClone.firstChild.nodeType !== Node.ELEMENT_NODE ||
      sotdClone.firstChild.localName !== "section"
    ) {
      additionalNodes.appendChild(sotdClone.firstChild);
      continue;
    }
    break;
  }
  additionalContent.appendChild(additionalNodes);
  conf.additionalContent = additionalContent.innerHTML;
  // Whatever sections are left, we throw at the end.
  conf.additionalSections = sotdClone.innerHTML;
  return tmpls[conf.isCGBG ? "cgbg-sotd.html" : "sotd.html"](conf);
}
