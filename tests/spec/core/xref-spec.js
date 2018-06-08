"use strict";
describe("Core — xref", () => {
  afterAll(flushIframes);

  it("adds link to unique <a> terms", async () => {
    const body = `
      <a id="link1">EventHandler</a>
      <a id="link2" data-xref="EventHandler">typedef EventHandler</a>
    `;
    const ops = makeStandardOps({ xref: true }, body);
    const doc = await makeRSDoc(ops);

    const link1 = doc.getElementById("link1");
    expect(link1.href).toEqual(
      "https://html.spec.whatwg.org/multipage/webappapis.html#eventhandler"
    );

    const link2 = doc.getElementById("link2");
    expect(link2.href).toEqual(
      "https://html.spec.whatwg.org/multipage/webappapis.html#eventhandler"
    );
  });
});
