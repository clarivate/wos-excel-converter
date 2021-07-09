import { ExportConfig } from "@/apis/helper/ExportConfig";

export const defaultConfig: ExportConfig = {
  sheetName: "ResearchOutput",
  rowArrayPath: "Data.Records.records.REC[*]",
  columns: [
    {
      name: "UT",
      path: "UID"
    },
    {
      name: "Database",
      path: "static_data.summary.EWUID.WUID.coll_id"
    },
    {
      name: "edition",
      path: "static_data.summary.EWUID.edition.value"
    },
    {
      name: "doctype_1",
      path: "static_data.summary.doctypes.[doctype][]|[0]"
    },
    {
      name: "doctype_2",
      path: "static_data.summary.doctypes.[doctype][]|[1]"
    },
    {
      name: "doctype_3",
      path: "static_data.summary.doctypes.[doctype][]|[2]"
    },
    {
      name: "doctype_4",
      path: "static_data.summary.doctypes.[doctype][]|[3]"
    },
    {
      name: "primaryLanguage",
      path:
        "static_data.fullrecord_metadata.normalized_languages.[language][].{lang: @}[?lang.type=='primary'].lang.content|[0]"
    },
    {
      name: "citedReferences",
      path: "static_data.fullrecord_metadata.refs.count"
    },
    {
      name: "citationCount",
      path: "dynamic_data.citation_related.tc_list.silo_tc.local_count"
    },
    {
      name: "keywords",
      path: "static_data.fullrecord_metadata.keywords.[keyword][]|concat(@,',')"
    },
    {
      name: "keywords_plus",
      path: "static_data.item.keywords_plus.[keyword][]|concat(@,',')"
    },
    {
      name: "bibtype",
      path: "static_data.item.bib_pagecount.type"
    },
    {
      name: "bib_pagecount",
      path: "static_data.item.bib_pagecount.content"
    },
    {
      name: "bib_id",
      path: "static_data.item.bib_id"
    },
    {
      name: "subheading_1",
      path:
        "static_data.fullrecord_metadata.category_info.subheadings.[subheading][]|[0]"
    },
    {
      name: "subheading_2",
      path:
        "static_data.fullrecord_metadata.category_info.subheadings.[subheading][]|[1]"
    },
    {
      name: "subject_traditional",
      path:
        "static_data.fullrecord_metadata.category_info.subjects.[subject][].{subject:@}[?subject.ascatype=='traditional'].subject.content|[0]"
    },
    {
      name: "subject_extended",
      path:
        "static_data.fullrecord_metadata.category_info.subjects.[subject][].{subject:@}[?subject.ascatype=='extended'].subject.content|[0]"
    },
    {
      name: "heading_1",
      path:
        "static_data.fullrecord_metadata.category_info.headings.[heading][]|[0]"
    },
    {
      name: "heading_2",
      path:
        "static_data.fullrecord_metadata.category_info.headings.[heading][]|[1]"
    },
    {
      name: "abstract",
      path:
        "static_data.fullrecord_metadata.abstracts.[abstract.abstract_text.[p][]][]|concat(@,'\n')"
    }
  ],
  columnCollection: [
    {
      mainPath: "static_data.summary.pub_info",
      columns: [
        {
          name: "coverdate",
          path: "coverdate"
        },
        {
          name: "vol",
          path: "vol"
        },
        {
          name: "pubyear",
          path: "pubyear"
        },
        {
          name: "sortdate",
          path: "sortdate"
        },
        {
          name: "pubmonth",
          path: "pubmonth"
        },
        {
          name: "pubtype",
          path: "pubtype"
        },
        {
          name: "journal_oas_gold",
          path: "journal_oas_gold"
        }
      ]
    },
    {
      mainPath: "dynamic_data.cluster_related.identifiers",
      columns: [
        {
          name: "issn",
          path: "identifier[?type=='issn'].value|[0]"
        },
        {
          name: "eissn",
          path: "identifier[?type=='eissn'].value|[0]"
        },
        {
          name: "doi",
          path: "identifier[?type=='doi'].value|[0]"
        }
      ]
    },
    {
      mainPath: "static_data.summary.titles",
      columns: [
        {
          name: "source",
          path: "title[?type=='source'].content|[0]"
        },
        {
          name: "title",
          path: "title[?type=='item'].content|[0]"
        },
        {
          name: "source_abbrev",
          path: "title[?type=='source_abbrev'].content|[0]"
        },
        {
          name: "abbrev_iso",
          path: "title[?type=='abbrev_iso'].content|[0]"
        },
        {
          name: "abbrev_11",
          path: "title[?type=='abbrev_11'].content|[0]"
        },
        {
          name: "abbrev_29",
          path: "title[?type=='abbrev_29'].content|[0]"
        }
      ]
    },
    {
      mainPath: "static_data.summary.publishers.publisher.names.[name][]",
      columns: [
        {
          name: "publisher_seq_no",
          path: "seq_no"
        },
        {
          name: "publisher_role",
          path: "role"
        },
        {
          name: "publisher_full_name",
          path: "full_name"
        },
        {
          name: "publisher_addr_no",
          path: "addr_no"
        },
        {
          name: "publisher_display_name",
          path: "display_name"
        }
      ]
    }
  ],
  sheets: [
    {
      sheetName: "AddressesAndAuthors",
      mainPath: "static_data.fullrecord_metadata.addresses.[address_name][]",
      referenceColumns: ["UT"],
      columns: [
        {
          name: "country",
          path: "address_spec.country"
        },
        {
          name: "zipLocation",
          path: "address_spec.zip.location"
        },
        {
          name: "zipCode",
          path: "address_spec.zip.content"
        },
        {
          name: "city",
          path: "address_spec.city"
        },
        {
          name: "street",
          path: "address_spec.street"
        },
        {
          name: "addr_no",
          path: "address_spec.addr_no"
        },
        {
          name: "full_address",
          path: "address_spec.full_address"
        },
        {
          name: "orgaNameConcatenated",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref==`null`].orga[]||concat(@,';')"
        },
        {
          name: "orgaEnhancedName_1",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref=='Y'].orga.content|[0]"
        },
        {
          name: "orgaEnhancedName_2",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref=='Y'].orga.content|[1]"
        },
        {
          name: "orgaEnhancedName_3",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref=='Y'].orga.content|[2]"
        },
        {
          name: "orgaEnhancedName_4",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref=='Y'].orga.content|[3]"
        },
        {
          name: "subOrgaNameConcatenated",
          path:
            "address_spec.suborganizations.[suborganization][]|concat(@,';')"
        }
      ],
      columnCollection: [
        {
          mainPath: "names.[name][]",
          columns: [
            {
              name: "seq_no",
              path: "seq_no"
            },
            {
              name: "full_name",
              path: "full_name"
            },
            {
              name: "role",
              path: "role"
            },
            {
              name: "claim_status",
              path: "claim_status"
            },
            {
              name: "reprint",
              path: "reprint"
            },
            {
              name: "addr_no",
              path: "addr_no"
            },
            {
              name: "last_name",
              path: "last_name"
            },
            {
              name: "display_name",
              path: "display_name"
            },
            {
              name: "wos_standard",
              path: "wos_standard"
            },
            {
              name: "daisng_id",
              path: "daisng_id"
            },
            {
              name: "first_name",
              path: "first_name"
            },
            {
              name: "PreferredRID",
              path:
                '"data-item-ids"."data-item-id"[?"id-type"==\'PreferredRID\'].content|[0]'
            },
            {
              name: "OtherRID",
              path:
                '"data-item-ids"."data-item-id"[?"id-type"==\'OtherRID\'].content|[0]'
            },
            {
              name: "orcid_id",
              path: "orcid_id"
            },
            {
              name: "preferredFullName",
              path: "preferred_name.full_name"
            },
            {
              name: "preferredLastName",
              path: "preferred_name.last_name"
            },
            {
              name: "preferredFirstName",
              path: "preferred_name.first_name"
            }
          ]
        }
      ]
    },
    {
      sheetName: "AuthorsWOAddress",
      mainPath:
        "static_data.summary.names.[name][].{author: @}[?author.addr_no==`null`].author[]",
      referenceColumns: ["UT"],
      columns: [
        {
          name: "seq_no",
          path: "seq_no"
        },
        {
          name: "full_name",
          path: "full_name"
        },
        {
          name: "role",
          path: "role"
        },
        {
          name: "claim_status",
          path: "claim_status"
        },
        {
          name: "reprint",
          path: "reprint"
        },
        {
          name: "addr_no",
          path: "addr_no"
        },
        {
          name: "last_name",
          path: "last_name"
        },
        {
          name: "display_name",
          path: "display_name"
        },
        {
          name: "wos_standard",
          path: "wos_standard"
        },
        {
          name: "daisng_id",
          path: "daisng_id"
        },
        {
          name: "first_name",
          path: "first_name"
        },
        {
          name: "PreferredRID",
          path:
            '"data-item-ids"."data-item-id"[?"id-type"==\'PreferredRID\'].content|[0]'
        },
        {
          name: "OtherRID",
          path:
            '"data-item-ids"."data-item-id"[?"id-type"==\'OtherRID\'].content|[0]'
        },
        {
          name: "orcid_id",
          path: "orcid_id"
        },
        {
          name: "preferredFullName",
          path: "preferred_name.full_name"
        },
        {
          name: "preferredLastName",
          path: "preferred_name.last_name"
        },
        {
          name: "preferredFirstName",
          path: "preferred_name.first_name"
        }
      ]
    },
    {
      sheetName: "Grants",
      mainPath: "static_data.fullrecord_metadata.[fund_ack][]",
      referenceColumns: ["UT", "pubyear"],
      columns: [
        {
          name: "fund_text",
          path: "fund_text.p"
        },
        {
          name: "grants_count",
          path: "grants.count"
        }
      ],
      columnCollection: [
        {
          mainPath: "grants.[grant][]",
          api: "WOS",
          columns: [
            {
              name: "grantAgency",
              path: "grant_agency"
            },
            {
              name: "grantIds",
              path: "grant_ids.[grant_id][]|concat(@,',')"
            }
          ]
        }
      ]
    }
  ]
};
