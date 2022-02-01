import { ExportConfig } from "@/apis/helper/ExportConfig";

export const defaultConfig: ExportConfig = {
  sheetName: "ResearchOutput",
  rowArrayPath: "Records.records.REC[*]",
  api: "WOS",
  csv: {
    rowDelimiter: "\n",
    fieldDelimiter: ",",
    quote: '"'
  },
  columns: [
    {
      name: "Accession Number (UT)",
      path: "UID"
    },
    {
      name: "Database",
      path: "static_data.summary.EWUID.WUID.coll_id"
    },
    {
      name: "Editions",
      path: "static_data.summary.EWUID.[edition][].[value][]|concat(@,',')"
    },
    {
      name: "1st Document Type",
      path: "static_data.summary.doctypes.[doctype][]|[0]"
    },
    {
      name: "2nd Document Type",
      path: "static_data.summary.doctypes.[doctype][]|[1]"
    },
    {
      name: "3rd Document Type",
      path: "static_data.summary.doctypes.[doctype][]|[2]"
    },
    {
      name: "All Document Types (comma-separated)",
      path: "static_data.summary.doctypes.[doctype][]|concat(@,',')"
    },
    {
      name: "Primary Language",
      path:
        "static_data.fullrecord_metadata.normalized_languages.[language][].{lang: @}[?lang.type=='primary'].lang.content|[0]"
    },
    {
      name: "Number of Cited References",
      path: "static_data.fullrecord_metadata.refs.count"
    },
    {
      name: "Times Cited",
      path: "dynamic_data.citation_related.tc_list.silo_tc.local_count"
    },
    {
      name: "Keywords",
      path: "static_data.fullrecord_metadata.keywords.[keyword][]|concat(@,',')"
    },
    {
      name: "Keywords Plus",
      path: "static_data.item.keywords_plus.[keyword][]|concat(@,',')"
    },
    {
      name: "Bib Type",
      path: "static_data.item.bib_pagecount.type"
    },
    {
      name: "Page count",
      path: "static_data.item.bib_pagecount.content"
    },
    {
      name: "Bib ID",
      path: "static_data.item.bib_id"
    },
    {
      name: "1st Subject Sub-Heading",
      path:
        "static_data.fullrecord_metadata.category_info.subheadings.[subheading][]|[0]"
    },
    {
      name: "2nd Subject Sub-Heading",
      path:
        "static_data.fullrecord_metadata.category_info.subheadings.[subheading][]|[1]"
    },
    {
      name: "1st Subject Category (traditional)",
      path:
        "static_data.fullrecord_metadata.category_info.subjects.[subject][].{subject:@}[?subject.ascatype=='traditional'].subject.content|[0]"
    },
    {
      name: "2nd Subject Category (traditional)",
      path:
        "static_data.fullrecord_metadata.category_info.subjects.[subject][].{subject:@}[?subject.ascatype=='traditional'].subject.content|[1]"
    },
    {
      name: "Subject Category (extended)",
      path:
        "static_data.fullrecord_metadata.category_info.subjects.[subject][].{subject:@}[?subject.ascatype=='extended'].subject.content[]|concat(@,',')"
    },
    {
      name: "1st Category Heading",
      path:
        "static_data.fullrecord_metadata.category_info.headings.[heading][]|[0]"
    },
    {
      name: "2nd Category Heading",
      path:
        "static_data.fullrecord_metadata.category_info.headings.[heading][]|[1]"
    },
    {
      name: "Abstract",
      path:
        "static_data.fullrecord_metadata.abstracts.[abstract.abstract_text.[p][]][]|concat(@,'\n')"
    }
  ],
  columnCollection: [
    {
      mainPath: "static_data.summary.pub_info",
      api: "WOS",
      columns: [
        {
          name: "Cover date",
          path: "coverdate"
        },
        {
          name: "Vol",
          path: "vol"
        },
        {
          name: "Published Year",
          path: "pubyear"
        },
        {
          name: "Sort date",
          path: "sortdate"
        },
        {
          name: "Published month",
          path: "pubmonth"
        },
        {
          name: "Published Type",
          path: "pubtype"
        },
        {
          name: "Journal OA Gold",
          path: "journal_oas_gold"
        }
      ]
    },
    {
      mainPath: "dynamic_data.cluster_related.identifiers",
      api: "WOS",
      columns: [
        {
          name: "ISSN",
          path: "identifier[?type=='issn'].value|[0]"
        },
        {
          name: "EISSN",
          path: "identifier[?type=='eissn'].value|[0]"
        },
        {
          name: "DOI",
          path: "identifier[?type=='doi'].value|[0]"
        },
        {
          name: "XREF DOI",
          path: "identifier[?type=='xref_doi'].value|[0]"
        },
        {
          name: "Pubmed ID",
          path: "identifier[?type=='pmid'].value|[0]"
        },
        {
          name: "ISBN",
          path: "identifier[?type=='isbn'].value|[0]"
        },
        {
          name: "EISBN",
          path: "identifier[?type=='eisbn'].value|[0]"
        },
        {
          name: "Parent Book DOI",
          path: "identifier[?type=='parent_book_doi'].value|[0]"
        }
      ]
    },
    {
      mainPath: "static_data.summary.titles",
      api: "WOS",
      columns: [
        {
          name: "Source title",
          path: "title[?type=='source'].content|[0]"
        },
        {
          name: "Title",
          path: "title[?type=='item'].content|[0]"
        },
        {
          name: "Source Abbreviation",
          path: "title[?type=='source_abbrev'].content|[0]"
        },
        {
          name: "Abbreviation ISO",
          path: "title[?type=='abbrev_iso'].content|[0]"
        },
        {
          name: "Abbreviation 11",
          path: "title[?type=='abbrev_11'].content|[0]"
        },
        {
          name: "Abbreviation 29",
          path: "title[?type=='abbrev_29'].content|[0]"
        }
      ]
    },
    {
      mainPath: "static_data.summary.publishers.publisher.names.[name][]",
      api: "WOS",
      columns: [
        {
          name: "Publisher SeqNo",
          path: "seq_no"
        },
        {
          name: "Publisher Role",
          path: "role"
        },
        {
          name: "Publisher Full Name",
          path: "full_name"
        },
        {
          name: "Publisher Address No",
          path: "addr_no"
        },
        {
          name: "Publisher Display name",
          path: "display_name"
        }
      ]
    },
    {
      mainPath: "incites_api_metrics",
      api: "InCites",
      columns: [
        {
          name: "International Collaboration",
          path: "IS_INTERNATIONAL_COLLAB"
        },
        {
          name: "Industry Collaboration",
          path: "IS_INDUSTRY_COLLAB"
        },
        {
          name: "Times Cited (InCites)",
          path: "TIMES_CITED"
        },
        {
          name: "Journal Expected Citations",
          path: "JOURNAL_EXPECTED_CITATIONS"
        },
        {
          name: "Open Access",
          path: "OPEN_ACCESS.OA_FLAG"
        },
        {
          name: "Open Access Status",
          path: "OPEN_ACCESS.STATUS[].TYPE[]|concat(@,';')"
        },
        {
          name: "Journal Normalized Citation Impact",
          path: "JNCI"
        },
        {
          name: "Document Type",
          path: "DOCUMENT_TYPE"
        },
        {
          name: "Journal Impact Factor (current year)",
          path: "IMPACT_FACTOR"
        },
        {
          name: "Institutional Collaboration",
          path: "IS_INSTITUTION_COLLAB"
        },
        {
          name: "Harmonic mean",
          path: "HARMEAN_CAT_EXP_CITATION"
        },
        {
          name: "Category Normalized Citation Impact (Average)",
          path: "AVG_CNCI"
        },
        {
          name: "Highly Cited Paper",
          path: "ESI_HIGHLY_CITED_PAPER"
        },
        {
          name: "Hot Paper",
          path: "ESI_HIGHLY_CITED_PAPER"
        }
      ]
    }
  ],
  sheets: [
    {
      sheetName: "Addresses and Names",
      mainPath: "static_data.fullrecord_metadata.addresses.[address_name][]",
      api: "WOS",
      referenceColumns: ["Accession Number (UT)"],
      columns: [
        {
          name: "Country",
          path: "address_spec.country"
        },
        {
          name: "Location",
          path: "address_spec.zip.location"
        },
        {
          name: "Zip Code",
          path: "address_spec.zip.content"
        },
        {
          name: "City",
          path: "address_spec.city"
        },
        {
          name: "Street",
          path: "address_spec.street"
        },
        {
          name: "Address No",
          path: "address_spec.addr_no"
        },
        {
          name: "Full Address",
          path: "address_spec.full_address"
        },
        {
          name: "Organisation names (concatenated)",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref==null].orga.content[]|concat(@,';')"
        },
        {
          name: "1st Enhanced Organisation name",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref=='Y'].orga.content|[0]"
        },
        {
          name: "2nd Enhanced Organisation name",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref=='Y'].orga.content|[1]"
        },
        {
          name: "3nd Enhanced Organisation name",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref=='Y'].orga.content|[2]"
        },
        {
          name: "Enhanced Organisation Names (concatenated)",
          path:
            "address_spec.organizations.[organization][].{orga: @}[?orga.pref=='Y'].orga.content[]|concat(@,';')"
        },
        {
          name: "Sub-organisation names (concatenated)",
          path:
            "address_spec.suborganizations.[suborganization][]|concat(@,';')"
        }
      ],
      columnCollection: [
        {
          mainPath: "names.[name][]",
          api: "WOS",
          columns: [
            {
              name: "Researcher/Author SeqNo (position)",
              path: "seq_no"
            },
            {
              name: "Full Name",
              path: "full_name"
            },
            {
              name: "Role",
              path: "role"
            },
            {
              name: "Claimed Web of Science Researcher Profile",
              path: "claim_status"
            },
            {
              name: "Reprint contact",
              path: "reprint"
            },
            {
              name: "Address No",
              path: "addr_no"
            },
            {
              name: "Last Name",
              path: "last_name"
            },
            {
              name: "Display Name",
              path: "display_name"
            },
            {
              name: "WOS Standard Name",
              path: "wos_standard"
            },
            {
              name: "Distinct Author ID",
              path: "daisng_id"
            },
            {
              name: "First Name",
              path: "first_name"
            },
            {
              name: "ResearcherID",
              path:
                '"data-item-ids"."data-item-id"[?"id-type"==\'PreferredRID\'].content|[0]'
            },
            {
              name: "Other ResearcherID",
              path:
                '"data-item-ids"."data-item-id"[?"id-type"==\'OtherRID\'].content|[0]'
            },
            {
              name: "ORCID ID",
              path: "orcid_id"
            },
            {
              name: "Preferred Full Name",
              path: "preferred_name.full_name"
            },
            {
              name: "Preferred Last Name",
              path: "preferred_name.last_name"
            },
            {
              name: "Preferred First Name",
              path: "preferred_name.first_name"
            }
          ]
        }
      ]
    },
    {
      sheetName: "Names without Addresses",
      api: "WOS",
      mainPath:
        "static_data.summary.names.[name][].{author: @}[?author.addr_no==`null`].author[]",
      referenceColumns: ["Accession Number (UT)"],
      columns: [
        {
          name: "Researcher/Author SeqNo (position)",
          path: "seq_no"
        },
        {
          name: "Full Name",
          path: "full_name"
        },
        {
          name: "Role",
          path: "role"
        },
        {
          name: "Claimed Web of Science Researcher Profile",
          path: "claim_status"
        },
        {
          name: "Reprint contact",
          path: "reprint"
        },
        {
          name: "Address No (Always empty)",
          path: "addr_no"
        },
        {
          name: "Last Name",
          path: "last_name"
        },
        {
          name: "Display Name",
          path: "display_name"
        },
        {
          name: "WOS Standard Name",
          path: "wos_standard"
        },
        {
          name: "Distinct Author ID",
          path: "daisng_id"
        },
        {
          name: "First Name",
          path: "first_name"
        },
        {
          name: "ResearcherID",
          path:
            '"data-item-ids"."data-item-id"[?"id-type"==\'PreferredRID\'].content|[0]'
        },
        {
          name: "Other ResearcherID",
          path:
            '"data-item-ids"."data-item-id"[?"id-type"==\'OtherRID\'].content|[0]'
        },
        {
          name: "ORCID ID",
          path: "orcid_id"
        },
        {
          name: "Preferred Full Name",
          path: "preferred_name.full_name"
        },
        {
          name: "Preferred Last Name",
          path: "preferred_name.last_name"
        },
        {
          name: "Preferred First Name",
          path: "preferred_name.first_name"
        }
      ]
    },
    {
      sheetName: "Grants",
      api: "WOS",
      mainPath: "static_data.fullrecord_metadata.[fund_ack][]",
      referenceColumns: ["Accession Number (UT)", "Published Year"],
      columns: [
        {
          name: "Funding Text",
          path: "fund_text.[p][]|concat(@,',')"
        },
        {
          name: "Number of Grants",
          path: "grants.count"
        }
      ],
      columnCollection: [
        {
          mainPath: "grants.[grant][]",
          api: "WOS",
          columns: [
            {
              name: "Grant Source",
              path: "grant_source"
            },
            {
              name: "Grant Agency",
              path: "grant_agency"
            },
            {
              name: "Grant IDs (concatenated)",
              path: "grant_ids.[grant_id][]|concat(@,',')"
            }
          ]
        }
      ]
    },
    {
      sheetName: "Percentiles (InCites)",
      referenceColumns: ["Accession Number (UT)"],
      mainPath: "[incites_api_metrics][]",
      api: "InCites",
      columns: [
        {
          name: "Accession Number",
          path: "ACCESSION_NUMBER"
        }
      ],
      columnCollection: [
        {
          mainPath: "PERCENTILE[]",
          api: "InCites",
          columns: [
            {
              name: "Code",
              path: "CODE"
            },
            {
              name: "Subject",
              path: "SUBJECT"
            },
            {
              name: "Category percentile",
              path: "CAT_PERC"
            },
            {
              name: "Category Expected Citation",
              path: "CAT_EXP_CITATION"
            },
            {
              name: "Category Normalized Citation Impact",
              path: "CNCI"
            },
            {
              name: "Best Category",
              path: "IS_BEST"
            }
          ]
        }
      ]
    },
    {
      sheetName: "Cited References",
      api: "WOS",
      referenceColumns: ["Accession Number (UT)"],
      mainPath: "cited_references.[Data][]",
      columns: [
        {
          name: "Reference UT",
          path: "UID"
        },
        {
          name: "Cited Author",
          path: "CitedAuthor"
        },
        {
          name: "Times Cited",
          path: "TimesCited"
        },
        {
          name: "Year",
          path: "Year"
        },
        {
          name: "Page",
          path: "Page"
        },
        {
          name: "Volume",
          path: "Volume"
        },
        {
          name: "CitedWork",
          path: "CitedWork"
        },
        {
          name: "CitedTitle",
          path: "CitedTitle"
        },
        {
          name: "DOI",
          path: "DOI"
        }
      ]
    }
  ]
};
