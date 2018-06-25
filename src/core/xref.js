// PRESENT ISSUES:
// looks good. doesn't work.

// main
export async function main(conf, possibleExternalLinks) {
  conf.xrefs = getRefMap(possibleExternalLinks);
  const query = createXrefQuery(conf.xrefs);
  const results = await fetchXrefs(query);
  addDataCiteToTerms(results, conf);
}

// returns possible external refs as Map(term, [{elem, specs, types}])
function getRefMap(elems) {
  return elems.reduce((xrefs, elem) => {
    let term = "xref" in elem.dataset ? elem.dataset.xref : elem.textContent;
    term = term.trim();
    const datacite = elem.closest("[data-cite]");
    const specs = datacite ? datacite.dataset.cite.split(" ") : [];
    const types = [];

    const xrefsForTerm = xrefs.has(term) ? xrefs.get(term) : [];
    xrefsForTerm.push({ elem, specs, types });
    return xrefs.set(term, xrefsForTerm);
  }, new Map());
}

// creates a body for POST request to API
function createXrefQuery(xrefs) {
  return [...xrefs.entries()].reduce(
    (query, [term, refs]) => {
      refs.reduce((keys, { specs, types }) => {
        keys.push({ term, specs, types });
        return keys;
      }, query.keys);
      return query;
    },
    { keys: [] }
  );
  // todo: return only unique
}

// fetch from network
async function fetchXrefs(query) {
  return await simulateShepherd(query);
}

// disambiguate fetched results based on xref{specs,types} i.e. context
function disambiguate(data, context) {
  if (!data || !data.length) return null;
  if (data.length === 1) {
    if (context.specs.length && !context.specs.includes(data[0].spec)) {
      return null;
    }
    return data[0]; // unambiguous
  }
  return data[0]; // todo
}

// adds data-cite attributes to terms
// on elem from conf.xref[term] for which results are found.
// unresolvable refs are returned as badRefs
function addDataCiteToTerms(results, conf) {
  for (const term in results) {
    conf.xrefs.get(term).forEach(entry => {
      const { elem } = entry;
      const result = disambiguate(results[term], entry);
      if (!result) {
        elem.classList.add("respec-offending-element");
        console.warn(`No data for `, elem);
        return;
      }
      const { uri, spec: cite } = result;
      conf.normativeReferences.add(cite); // make all normative for now. TODO.
      const path = uri.includes("/") ? uri.split("/", 1)[1] : uri;
      const [citePath, citeFrag] = path.split("#");
      Object.assign(elem.dataset, { cite, citePath, citeFrag });
    });
  }
}

// just a network simulation for prototype ignore.
async function simulateShepherd(query) {
  // live experimental end point:
  // https://wt-466c7865b463a6c4cbb820b42dde9e58-0.sandbox.auth0-extend.com/respec-xref-proto
  // await wait(10); // simulate network
  const result = {};
  const data = Data();
  for (const key of query.keys) {
    const { term } = key;
    result[term] = result[term] || [];
    if (term in data) {
      for (const item of data[term]) {
        if (filterFn(item, key)) result[term].push(item);
      }
    }
  }
  return result;

  function filterFn(item, { specs, types }) {
    let valid = true;
    if (Array.isArray(specs) && specs.length) {
      valid = specs.includes(item.spec);
    }
    if (Array.isArray(types) && types.length) {
      valid = valid && types.includes(item.type);
    }
    return valid;
  }

  function wait(duration = 1000) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve();
      }, duration);
    });
  }

  // this just exists to keep the distracting stuff at end of code
  function Data() {
    return {
      EventHandler: [
        {
          spec: "html",
          type: "typedef",
          normative: true,
          uri: "webappapis.html#eventhandler",
        },
      ],
      "event handler": [
        {
          spec: "html",
          type: "dfn",
          normative: true,
          uri: "webappapis.html#event-handlers",
        },
      ],
      "URL parser": [
        {
          spec: "url",
          type: "dfn",
          normative: true,
          uri: "#concept-url-parser",
        },
      ],
      request: [
        {
          spec: "service-workers",
          type: "attribute",
          for: ["FetchEvent"],
          normative: true,
          uri: "#dom-fetchevent-request",
        },
        {
          spec: "service-workers",
          type: "dict-member",
          for: ["FetchEventInit"],
          normative: true,
          uri: "#dom-fetcheventinit-request",
        },
        {
          spec: "service-workers",
          type: "dfn",
          for: ["cache batch operation"],
          normative: true,
          uri: "#dfn-cache-batch-operation-request",
        },
        {
          spec: "service-workers",
          type: "argument",
          for: ["Cache/add(request)"],
          normative: true,
          uri: "#dom-cache-add-request-request",
        },
        {
          spec: "service-workers",
          type: "argument",
          for: ["Cache/delete(request, options)", "Cache/delete(request)"],
          normative: true,
          uri: "#dom-cache-delete-request-options-request",
        },
        {
          spec: "service-workers",
          type: "argument",
          for: [
            "Cache/keys(request, options)",
            "Cache/keys(request)",
            "Cache/keys()",
          ],
          normative: true,
          uri: "#dom-cache-keys-request-options-request",
        },
        {
          spec: "service-workers",
          type: "argument",
          for: ["Cache/match(request, options)", "Cache/match(request)"],
          normative: true,
          uri: "#dom-cache-match-request-options-request",
        },
        {
          spec: "service-workers",
          type: "argument",
          for: [
            "Cache/matchAll(request, options)",
            "Cache/matchAll(request)",
            "Cache/matchAll()",
          ],
          normative: true,
          uri: "#dom-cache-matchall-request-options-request",
        },
        {
          spec: "service-workers",
          type: "argument",
          for: ["Cache/put(request, response)"],
          normative: true,
          uri: "#dom-cache-put-request-response-request",
        },
        {
          spec: "service-workers",
          type: "argument",
          for: [
            "CacheStorage/match(request, options)",
            "CacheStorage/match(request)",
          ],
          normative: true,
          uri: "#dom-cachestorage-match-request-options-request",
        },
        {
          spec: "webusb",
          type: "dict-member",
          normative: true,
          for: ["USBControlTransferParameters"],
          uri: "#dom-usbcontroltransferparameters-request",
        },
        {
          spec: "fetch",
          type: "dfn",
          normative: true,
          uri: "#concept-request",
        },
        {
          spec: "fetch",
          type: "dfn",
          normative: true,
          for: ["fetch record"],
          uri: "#concept-fetch-record-request",
        },
      ],
      Request: [
        {
          spec: "fetch",
          type: "interface",
          normative: true,
          uri: "#request",
        },
      ],
    };
  }
}
