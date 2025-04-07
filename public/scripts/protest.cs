using UnityEngine;
using TMPro;

public class Protester : MonoBehaviour
{
    public TextMeshPro signText;

    private string[] slogans = {
        "Justice Now!",
        "We Want Change!",
        "Power to the People!",
        "No More Silence!",
        "Our Voices Matter!"
    };

    void Start()
    {
        // Assign a random slogan
        if (signText != null)
        {
            signText.text = slogans[Random.Range(0, slogans.Length)];
        }
    }
}
