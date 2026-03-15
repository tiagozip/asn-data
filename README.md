# ASN data

This repository serves JSON files and icons for ASNs, sourced from [peeringdb](https://peeringdb.com/) and updated every week with GitHub Actions.

It's designed to be used as a simple CDN/API for getting ASN information and logos with little to no ratelimits.

## Usage

```
https://tiagozip.github.io/asn-data/asn/13335.json
```

```json
{
  "id": 4224,
  "org_id": 4715,
  "name": "Cloudflare",
  "aka": "",
  "name_long": "",
  "website": "https://www.cloudflare.com",
  "social_media": [
    {
      "service": "website",
      "identifier": "https://www.cloudflare.com"
    }
  ],
  "asn": 13335,
  "looking_glass": "",
  "route_server": "",
  "irr_as_set": "AS13335:AS-CLOUDFLARE",
  "info_type": "Content",
  "info_types": [
    "Content"
  ],
  "info_prefixes4": 80000,
  "info_prefixes6": 30000,
  "info_traffic": "",
  "info_ratio": "Mostly Outbound",
  "info_scope": "Global",
  "info_unicast": true,
  "info_multicast": false,
  "info_ipv6": true,
  "info_never_via_route_servers": false,
  "ix_count": 351,
  "fac_count": 221,
  "notes": "...",
  "netixlan_updated": "2026-03-12T09:14:09Z",
  "netfac_updated": "2025-10-07T22:40:52Z",
  "poc_updated": "2025-12-04T21:15:09Z",
  "policy_url": "https://www.cloudflare.com/peering-policy/",
  "policy_general": "Open",
  "policy_locations": "Preferred",
  "policy_ratio": false,
  "policy_contracts": "Not Required",
  "allow_ixp_update": false,
  "status_dashboard": "https://www.cloudflarestatus.com/",
  "rir_status": "ok",
  "rir_status_updated": "2024-06-26T04:47:55Z",
  "logo": "http://testserver/m/logos_user_supplied/network-4224-70070349.png",
  "created": "2011-09-06T19:40:05Z",
  "updated": "2026-03-12T09:14:31Z",
  "status": "ok"
}
```

### Full-width logos

You can request a full-width logo from the `logo` field:

```js
const logo_field = "http://testserver/m/logos_user_supplied/network-4224-70070349.png";

const logo_url = logo_field.replace(
  "http://testserver/m",
  "https://peeringdb-media-prod.s3.amazonaws.com/media",
);
```

### Favicons

You can fetch a favicon of the ASN website URL by using the following URL:

```
https://tiagozip.github.io/asn-data/logos/13335.png
```