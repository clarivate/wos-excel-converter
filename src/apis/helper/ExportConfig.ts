export interface ExportConfig {
  sheetName: string;
  rowArrayPath: string;
  columns: Array<ColumnConfig>;
  columnCollection?: Array<ColumnCollectionConfig>;
  sheets: Array<SheetConfig>;
}

export interface SheetConfig {
  sheetName: string;
  rowArrayPath: Array<string>;
  referenceColumns?: Array<string>;
  columns: Array<ColumnConfig>;
  columnCollection?: Array<ColumnCollectionConfig>;
}

export interface ColumnCollectionConfig {
  mainPath: string;
  columns: Array<ColumnConfig>;
}

export interface ColumnConfig {
  name: string;
  path: string;
}

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
        }
      ]
    },
    {
      mainPath: "static_data.summary.titles",
      columns: [
        {
          name: "source",
          path: "title[?type=='source'].content"
        },
        {
          name: "title",
          path: "title[?type=='item'].content"
        },
        {
          name: "source_abbrev",
          path: "title[?type=='source_abbrev'].content"
        },
        {
          name: "abbrev_iso",
          path: "title[?type=='abbrev_iso'].content"
        },
        {
          name: "abbrev_11",
          path: "title[?type=='abbrev_11'].content"
        },
        {
          name: "abbrev_29",
          path: "title[?type=='abbrev_29'].content"
        }
      ]
    },
    {
      mainPath: "static_data.summary.publishers.publisher.names.name",
      columns: [
        {
          name: "publisher_seq_no",
          path: "seq_mo"
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
      sheetName: "Authors",
      rowArrayPath: [
        "static_data.fullrecord_metadata.addresses.address_name[].names.name[]",
        "static_data.fullrecord_metadata.addresses[?count == `1`].address_name.names.name[]",
        "static_data.fullrecord_metadata.addresses[?count == `1`].address_name.names[?count == `1`].name",
        "static_data.fullrecord_metadata.addresses.address_name[].names[?count == `1`].name"
      ],
      referenceColumns: ["UT"],
      columns: [
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
      sheetName: "KeywordsPlus",
      rowArrayPath: ["static_data.item.keywords_plus.keyword[]"],
      referenceColumns: ["UT"],
      columns: [
        {
          name: "keyword",
          path: "@"
        }
      ]
    }
  ]
};
